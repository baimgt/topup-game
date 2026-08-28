import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import PaymentConfig from "@/models/PaymentConfig";
import Setting from "@/models/Setting";
import { getUserFromRequest } from "@/lib/auth";
import { createSnapTransaction } from "@/lib/midtrans";
import { createDuitkuTransaction } from "@/lib/duitku";
import { defaultMethods, defaultDuitkuMethods } from "@/lib/payment-methods";
import { generateOrderNumber } from "@/lib/utils";
import { sendInvoiceEmail } from "@/lib/mail";
import { inquiryPascabayar, generateRefId } from "@/lib/digiflazz";
import { z } from "zod";

const pascabayarOrderSchema = z.object({
  sku: z.string().min(1, "SKU tagihan wajib diisi"),
  productName: z.string().min(1, "Nama produk wajib diisi"),
  customerNo: z.string().min(1, "Nomor pelanggan wajib diisi"),
  customerName: z.string().default("Pelanggan"),
  customerEmail: z.string().email("Email tidak valid"),
  customerPhone: z.string().min(9, "Nomor WhatsApp/HP minimal 9 digit").optional(),
  // refId sekarang opsional — server akan generate sendiri untuk keamanan
  refId: z.string().optional(),
  // billAmount & adminFee tetap diterima tapi TIDAK dipercaya — akan divalidasi ulang
  billAmount: z.number().min(1, "Nominal tagihan tidak valid"),
  adminFee: z.number().min(0).default(0),
  penalty: z.number().min(0).default(0),
  period: z.string().optional(),
  tariff: z.string().optional(),
  daya: z.number().optional(),
  standMeter: z.string().optional(),
  lembarTagihan: z.number().optional(),
  detail: z.array(z.any()).optional(),
  paymentMethodId: z.string().min(1, "Metode pembayaran wajib dipilih"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const parsed = pascabayarOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      sku,
      productName,
      customerNo,
      customerName,
      customerEmail,
      customerPhone,
      billAmount: clientBillAmount,
      adminFee: clientAdminFee,
      penalty,
      period,
      tariff,
      daya,
      lembarTagihan,
      detail,
      paymentMethodId,
    } = parsed.data;

    // ── SECURITY: Server-side re-verification of bill amount ──────────────
    // JANGAN percaya billAmount & adminFee dari client!
    // Lakukan inquiry ulang ke Digiflazz untuk mendapatkan nominal tagihan asli
    const paymentConfig = await PaymentConfig.findOne({}).lean();

    const digiUsername =
      paymentConfig?.digiflazzUsername &&
      paymentConfig.digiflazzUsername !== "your-digiflazz-username"
        ? paymentConfig.digiflazzUsername
        : process.env.DIGIFLAZZ_USERNAME || "";
    const digiApiKey =
      paymentConfig?.digiflazzApiKey &&
      paymentConfig.digiflazzApiKey !== "your-digiflazz-api-key"
        ? paymentConfig.digiflazzApiKey
        : process.env.DIGIFLAZZ_API_KEY || "";

    // Generate refId di server — TIDAK percaya dari client
    const serverRefId = generateRefId();

    // Auto-detect test customer number
    const isTestCustomerNo = customerNo.startsWith("53000000000");

    let verifiedBillAmount = clientBillAmount;
    let verifiedAdminFee = clientAdminFee;

    // Re-inquiry untuk verifikasi nominal tagihan
    if (digiUsername && digiApiKey) {
      try {
        const inquiryResult = await inquiryPascabayar(sku, customerNo, serverRefId, {
          username: digiUsername,
          apiKey: digiApiKey,
          testing: isTestCustomerNo,
        });

        if (inquiryResult && inquiryResult.status !== "Gagal" && inquiryResult.price !== undefined) {
          const serverBillAmount = Number(inquiryResult.price) || 0;
          const serverBillerAdmin = Number(inquiryResult.admin) || 0;

          // ── Validasi: tolak jika client mencoba manipulasi billAmount ─────
          if (Math.abs(serverBillAmount - clientBillAmount) > 100) {
            console.error(
              `[SECURITY] Pascabayar billAmount mismatch! client=${clientBillAmount}, server=${serverBillAmount}, customerNo=${customerNo}`
            );
            return NextResponse.json(
              {
                success: false,
                error: "Nominal tagihan tidak sesuai. Silakan lakukan cek tagihan ulang.",
              },
              { status: 400 }
            );
          }

          // Gunakan nilai dari server (bukan client) untuk perhitungan
          verifiedBillAmount = serverBillAmount;

          // Hitung admin fee dari server
          const setting = await Setting.findOne({}).lean();
          const storeAdminFee = (setting as any)?.pascabayarAdminFee ?? 2500;
          verifiedAdminFee = Math.max(storeAdminFee, serverBillerAdmin);
        }
      } catch (inquiryErr) {
        // Jika inquiry gagal (misal timeout), tetap lanjut dengan client value
        // tapi log sebagai warning
        console.warn("[SECURITY] Pascabayar re-inquiry failed, using client values:", inquiryErr);
      }
    }

    const authUser = getUserFromRequest(req);
    let finalCustomerName = customerName;
    if (authUser) {
      const userDb = await User.findById(authUser.userId).lean();
      if (userDb && userDb.name) {
        finalCustomerName = userDb.name;
      }
    }

    const orderNumber = generateOrderNumber();

    // Base subtotal menggunakan VERIFIED values dari server
    const baseSubtotal = verifiedBillAmount + verifiedAdminFee;

    // Ambil metode pembayaran
    const activeGateway = paymentConfig?.activePaymentGateway || "midtrans";
    const dbMethods =
      activeGateway === "duitku"
        ? paymentConfig?.duitkuMethods
        : paymentConfig?.midtransMethods;
    let allMethods;
    if (dbMethods && dbMethods.length > 0) {
      allMethods = dbMethods;
    } else if (activeGateway === "duitku") {
      allMethods = defaultDuitkuMethods;
    } else {
      allMethods =
        paymentConfig?.paymentMethods && paymentConfig.paymentMethods.length > 0
          ? paymentConfig.paymentMethods
          : defaultMethods;
    }

    const selectedMethod = allMethods.find(
      (m: any) => m.id === paymentMethodId && m.enabled
    );
    if (!selectedMethod) {
      return NextResponse.json(
        { success: false, error: "Metode pembayaran tidak valid atau tidak aktif" },
        { status: 400 }
      );
    }

    // Biaya layanan payment method
    const feeAmount =
      selectedMethod.feeType === "percent"
        ? Math.round(baseSubtotal * (selectedMethod.fee / 100))
        : selectedMethod.fee;

    const totalAmount = baseSubtotal + feeAmount;

    const orderItems = [
      {
        productName: `Tagihan ${productName}`,
        quantity: 1,
        price: verifiedBillAmount,
        subtotal: verifiedBillAmount,
      },
    ];

    const midtransItems: any[] = [
      {
        id: `PASCA-${sku}`,
        name: `Tagihan ${productName} (${customerNo})`.slice(0, 50),
        price: verifiedBillAmount,
        quantity: 1,
      },
    ];

    if (verifiedAdminFee > 0) {
      midtransItems.push({
        id: `ADMIN-FEE`,
        name: `Biaya Admin Biller & Layanan`,
        price: verifiedAdminFee,
        quantity: 1,
      });
    }

    if (feeAmount > 0) {
      midtransItems.push({
        id: `FEE-${selectedMethod.id}`,
        name: `Biaya Pembayaran (${selectedMethod.name})`,
        price: feeAmount,
        quantity: 1,
      });
    }

    const order = await Order.create({
      orderNumber,
      userId: authUser?.userId || undefined,
      customerEmail,
      customerPhone: customerPhone || undefined,
      customerName: finalCustomerName,
      gameName: `Tagihan ${productName}`,
      gameUserId: customerNo,
      gameUsername: customerName,
      isVoucher: false,
      isPascabayar: true,
      digiflazzSku: sku,
      digiflazzRef: serverRefId,
      receiptUrl: `https://receipt.tagihanpulsa.com/digiflazz/${serverRefId}`,
      pascabayarData: {
        buyerSkuCode: sku,
        productName,
        customerNo,
        customerName,
        admin: verifiedAdminFee,
        feeAdminStore: verifiedAdminFee,
        billAmount: verifiedBillAmount,
        penalty,
        period,
        tariff,
        daya,
        standMeter: (parsed.data as any).standMeter,
        receiptUrl: `https://receipt.tagihanpulsa.com/digiflazz/${serverRefId}`,
        billCount: lembarTagihan,
        detail,
      },
      totalAmount,
      subtotalAmount: baseSubtotal,
      discountAmount: 0,
      ppn: 0,
      profit: verifiedAdminFee,
      paymentStatus: "UNPAID",
      orderStatus: "PENDING",
      paymentMethod: selectedMethod.name,
      orderItems,
    });

    let paymentToken = "";
    let paymentUrl = "";

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const appUrl = host ? `${protocol}://${host}` : undefined;

    if (activeGateway === "midtrans") {
      const midtrans = await createSnapTransaction({
        orderId: order.orderNumber,
        amount: order.totalAmount,
        customerName: finalCustomerName,
        customerEmail,
        items: midtransItems,
        enabledPayments: [selectedMethod.id],
        serverKey: paymentConfig?.midtransServerKey || "",
        clientKey: paymentConfig?.midtransClientKey || "",
        isProduction: paymentConfig?.midtransIsProduction || false,
        appUrl,
      });

      order.paymentToken = midtrans.token;
      order.paymentUrl = midtrans.redirect_url;
      paymentToken = midtrans.token;
      paymentUrl = midtrans.redirect_url;
    } else if (activeGateway === "duitku") {
      const duitkuRes = await createDuitkuTransaction(
        {
          orderId: order.orderNumber,
          amount: order.totalAmount,
          customerName: finalCustomerName,
          customerEmail,
          customerPhone: customerPhone || "081234567890",
          items: midtransItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          paymentMethod: selectedMethod.id,
        },
        {
          merchantCode: paymentConfig?.duitkuMerchantCode || "",
          apiKey: paymentConfig?.duitkuApiKey || "",
          isProduction: paymentConfig?.duitkuIsProduction || false,
          appUrl,
        }
      );

      order.paymentToken = duitkuRes.reference;
      order.paymentUrl = duitkuRes.paymentUrl;
      if (duitkuRes.vaNumber) order.vaNumber = duitkuRes.vaNumber;
      if (duitkuRes.qrString) order.qrString = duitkuRes.qrString;
      paymentToken = duitkuRes.reference;
      paymentUrl = duitkuRes.paymentUrl || "";
    }

    await order.save();

    // Kirim email tagihan ke customer
    sendInvoiceEmail(order).catch((e) =>
      console.error("Gagal mengirim email invoice tagihan pascabayar:", e)
    );

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentToken,
        paymentUrl,
        vaNumber: order.vaNumber,
        qrString: order.qrString,
        paymentMethod: selectedMethod.name,
      },
    });
  } catch (error: any) {
    console.error("Create pascabayar order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat order tagihan" },
      { status: 500 }
    );
  }
}

