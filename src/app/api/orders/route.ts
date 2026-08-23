import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Game from "@/models/Game";
import User from "@/models/User";
import PaymentConfig from "@/models/PaymentConfig";
import { getUserFromRequest } from "@/lib/auth";
import { createSnapTransaction } from "@/lib/midtrans";
import { createDuitkuTransaction } from "@/lib/duitku";
import { defaultMethods, defaultDuitkuMethods } from "@/lib/payment-methods";
import { generateOrderNumber } from "@/lib/utils";
import { sendInvoiceEmail } from "@/lib/mail";
import { z } from "zod";

const createOrderSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  gameUserId: z.string().optional().default("VOUCHER"),
  gameServerId: z.string().optional(),
  gameUsername: z.string().optional(),
  customerName: z.string().optional().default("Guest"),
  customerEmail: z.string().email("Email tidak valid"),
  customerPhone: z.string().min(9, "Nomor telepon minimal 9 karakter").optional(),
  paymentMethodId: z.string().min(1, "Metode pembayaran wajib dipilih"),
  voucherCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, gameUserId, gameServerId, gameUsername, customerName, customerEmail, customerPhone, paymentMethodId, voucherCode } = parsed.data;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const game = await Game.findById(product.gameId);
    if (!game) {
      return NextResponse.json({ success: false, error: "Game tidak ditemukan" }, { status: 404 });
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

    // Check for active Flash Sale
    const FlashSale = (await import("@/models/FlashSale")).default;
    const activeFlashSale = await FlashSale.findOne({
      productId: product._id,
      isActive: true,
      endTime: { $gt: new Date() },
      stockLeft: { $gt: 0 }
    });

    const basePrice = activeFlashSale ? activeFlashSale.discountPrice : product.sellingPrice;

    // Check voucher discount
    let discountAmount = 0;
    let appliedVoucherCode: string | undefined = undefined;

    if (voucherCode && voucherCode.trim()) {
      const Voucher = (await import("@/models/Voucher")).default;
      const cleanCode = voucherCode.trim().toUpperCase();

      // Atomic update: hanya berhasil jika voucher valid DAN kuota masih ada
      // Ini mencegah race condition (double spending) dari multiple request bersamaan
      const voucher = await Voucher.findOneAndUpdate(
        {
          code: cleanCode,
          isActive: true,
          expiryDate: { $gt: new Date() },
          $and: [
            {
              $or: [
                { usageLimit: { $lte: 0 } }, // unlimited
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } }, // masih ada sisa
              ],
            },
            {
              $or: [
                { gameId: { $exists: false } },
                { gameId: null },
                { gameId: game._id },
              ],
            }
          ]
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (voucher) {
        // Validasi minPurchase setelah atomic update berhasil
        if (!voucher.minPurchase || basePrice >= voucher.minPurchase) {
          if (voucher.discountType === "flat") {
            discountAmount = voucher.discountValue;
          } else {
            discountAmount = Math.round((basePrice * voucher.discountValue) / 100);
            if (voucher.maxDiscount > 0 && discountAmount > voucher.maxDiscount) {
              discountAmount = voucher.maxDiscount;
            }
          }
          if (discountAmount > basePrice) discountAmount = basePrice;
          appliedVoucherCode = voucher.code;
        } else {
          // Rollback jika minPurchase tidak terpenuhi
          await Voucher.findByIdAndUpdate(voucher._id, { $inc: { usedCount: -1 } });
        }
      }
    }

    const priceAfterDiscount = Math.max(0, basePrice - discountAmount);

    // Ambil metode pembayaran aktif dari DB berdasarkan gateway yang aktif
    const paymentConfig = await PaymentConfig.findOne({});
    const activeGateway = paymentConfig?.activePaymentGateway || "midtrans";
    const dbMethods = activeGateway === "duitku" ? paymentConfig?.duitkuMethods : paymentConfig?.midtransMethods;
    let allMethods;
    if (dbMethods && dbMethods.length > 0) {
      allMethods = dbMethods;
    } else if (activeGateway === "duitku") {
      allMethods = defaultDuitkuMethods;
    } else {
      // Legacy fallback for midtrans
      allMethods = paymentConfig?.paymentMethods && paymentConfig.paymentMethods.length > 0 ? paymentConfig.paymentMethods : defaultMethods;
    }
      
    const selectedMethod = allMethods.find((m: any) => m.id === paymentMethodId && m.enabled);
    if (!selectedMethod) {
      return NextResponse.json({ success: false, error: "Metode pembayaran tidak valid atau tidak aktif" }, { status: 400 });
    }

    // Hitung biaya layanan
    const feeAmount = selectedMethod.feeType === "percent"
      ? Math.round(priceAfterDiscount * (selectedMethod.fee / 100))
      : selectedMethod.fee;
      
    // Hitung PPN 11%
    const ppnAmount = Math.round(priceAfterDiscount * 0.11);
    const totalAmount = priceAfterDiscount + feeAmount + ppnAmount;

    const orderItems = [
      {
        productId: product._id,
        productName: product.name,
        quantity: 1,
        price: basePrice,
        subtotal: basePrice,
      }
    ];

    const midtransItems = [
      {
        id: product._id.toString(),
        name: `${game.name} - ${product.name}`,
        price: basePrice,
        quantity: 1,
      }
    ];

    if (discountAmount > 0) {
      midtransItems.push({
        id: `DISCOUNT-${appliedVoucherCode}`,
        name: `Diskon Promo (${appliedVoucherCode})`,
        price: -discountAmount,
        quantity: 1,
      });
    }

    if (ppnAmount > 0) {
      midtransItems.push({
        id: `PPN-${product._id}`,
        name: "PPN (11%)",
        price: ppnAmount,
        quantity: 1,
      });
    }

    if (feeAmount > 0) {
      midtransItems.push({
        id: `FEE-${selectedMethod.id}`,
        name: `Biaya Layanan (${selectedMethod.name})`,
        price: feeAmount,
        quantity: 1,
      });
    }

    const isVoucher = Boolean(
      game.isVoucher ||
      game.category?.toLowerCase() === "voucher" ||
      (Array.isArray(game.targetInputs) && game.targetInputs.length === 0 && game.category?.toLowerCase() === "voucher")
    );

    const finalGameUserId = (gameUserId && gameUserId.trim()) ? gameUserId.trim() : (isVoucher ? "VOUCHER" : "-");

    const order = await Order.create({
      orderNumber,
      userId: authUser?.userId || undefined,
      customerEmail,
      customerName: finalCustomerName,
      gameId: game._id,
      gameName: game.name,
      gameUserId: finalGameUserId,
      gameServerId: gameServerId || undefined,
      gameUsername: isVoucher ? "Voucher Digital" : (gameUsername || undefined),
      isVoucher,
      totalAmount: totalAmount,
      subtotalAmount: basePrice,
      voucherCode: appliedVoucherCode,
      discountAmount,
      ppn: ppnAmount,
      customerPhone: customerPhone || undefined,
      paymentStatus: "UNPAID",
      orderStatus: "PENDING",
      paymentMethod: selectedMethod.name,
      orderItems,
      isFlashSale: !!activeFlashSale,
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
      await order.save();

      paymentToken = midtrans.token;
      paymentUrl = midtrans.redirect_url;
    } else if (activeGateway === "duitku") {
      const duitku = await createDuitkuTransaction({
        orderId: order.orderNumber,
        amount: order.totalAmount,
        customerName: finalCustomerName,
        customerEmail,
        customerPhone,
        paymentMethod: selectedMethod.id,
        items: midtransItems.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
      }, {
        merchantCode: paymentConfig?.duitkuMerchantCode || "",
        apiKey: paymentConfig?.duitkuApiKey || "",
        isProduction: paymentConfig?.duitkuIsProduction || false,
        appUrl: appUrl,
      });
      
      order.paymentToken = duitku.reference;
      order.paymentUrl = duitku.paymentUrl;
      if (duitku.vaNumber) order.vaNumber = duitku.vaNumber;
      if (duitku.qrString) order.qrString = duitku.qrString;
      await order.save();
      paymentToken = duitku.reference;
      paymentUrl = duitku.paymentUrl;
    }

    sendInvoiceEmail(order).catch(e => console.error("Invoice email error:", e));

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentToken,
        paymentUrl,
        totalAmount: order.totalAmount,
        gateway: activeGateway,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat pesanan" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "10")), 100); // max 100
    const skip = (page - 1) * limit;

    const filter = authUser.role === "ADMIN" ? {} : { userId: authUser.userId };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}
