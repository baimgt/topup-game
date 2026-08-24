import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PaymentConfig from "@/models/PaymentConfig";
import Setting from "@/models/Setting";
import DigiflazzProduct from "@/models/DigiflazzProduct";
import { inquiryPascabayar, generateRefId } from "@/lib/digiflazz";
import { z } from "zod";

const inquirySchema = z.object({
  sku: z.string().min(1, "SKU produk tagihan wajib diisi"),
  customerNo: z.string().min(4, "Nomor pelanggan / No Meter minimal 4 digit"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { sku, customerNo } = parsed.data;

    // Ambil konfigurasi Digiflazz
    const paymentConfig = await PaymentConfig.findOne({}).lean();
    const username =
      paymentConfig?.digiflazzUsername &&
      paymentConfig.digiflazzUsername !== "your-digiflazz-username"
        ? paymentConfig.digiflazzUsername
        : process.env.DIGIFLAZZ_USERNAME || "";
    const apiKey =
      paymentConfig?.digiflazzApiKey &&
      paymentConfig.digiflazzApiKey !== "your-digiflazz-api-key"
        ? paymentConfig.digiflazzApiKey
        : process.env.DIGIFLAZZ_API_KEY || "";

    if (!username || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Konfigurasi Digiflazz belum diatur di Admin > Pengaturan API",
        },
        { status: 400 }
      );
    }

    // Ambil nama produk dari DB untuk label
    const productInfo = await DigiflazzProduct.findOne({ buyer_sku_code: sku }).lean();
    const productName = productInfo?.product_name || sku.toUpperCase();

    // Ambil setting fee admin toko
    const setting = await Setting.findOne({}).lean();
    const storeAdminFee = setting?.pascabayarAdminFee ?? 2500;

    const refId = generateRefId();

    try {
      const digiResult = await inquiryPascabayar(sku, customerNo, refId, {
        username,
        apiKey,
        testing: false,
      });

      if (!digiResult) {
        return NextResponse.json(
          { success: false, error: "Tidak ada respon dari server biller Digiflazz" },
          { status: 502 }
        );
      }

      // Cek status inquiry
      if (digiResult.status === "Gagal" || (digiResult.rc && digiResult.rc !== "00")) {
        const errorMsg =
          digiResult.message || "Gagal melakukan cek tagihan. Pastikan nomor pelanggan sudah benar.";
        return NextResponse.json({ success: false, error: errorMsg, rc: digiResult.rc }, { status: 400 });
      }

      const billAmount = Number(digiResult.price) || 0;
      const billerAdminFee = Number(digiResult.admin) || 0;
      
      // Hitung margin keuntungan toko (jika storeAdminFee > billerAdminFee, atau gunakan storeAdminFee)
      const finalAdminFee = Math.max(storeAdminFee, billerAdminFee);
      const totalPayable = billAmount > 0 ? billAmount + (finalAdminFee - billerAdminFee) : 0;

      // Extract desc details
      const descData = digiResult.desc || {};
      const tagihanDetail = descData.tagihan?.detail || [];
      const period = tagihanDetail[0]?.periode || descData.tarif || "-";
      const tariff = descData.tarif || "-";
      const daya = descData.daya || 0;
      const lembarTagihan = descData.lembar_tagihan || tagihanDetail.length || 1;
      const penalty = tagihanDetail.reduce(
        (sum: number, d: any) => sum + (Number(d.denda) || 0),
        0
      );

      return NextResponse.json({
        success: true,
        data: {
          refId,
          sku,
          productName,
          customerNo: digiResult.customer_no || customerNo,
          customerName: digiResult.customer_name || "Pelanggan",
          billAmount,
          billerAdminFee,
          adminFee: finalAdminFee,
          penalty,
          totalAmount: totalPayable,
          period,
          tariff,
          daya,
          lembarTagihan,
          detail: tagihanDetail,
          rawDesc: descData,
          message: digiResult.message,
        },
      });
    } catch (err: any) {
      console.error("Inquiry Digiflazz Error:", err.response?.data || err);
      const digiError =
        err.response?.data?.data?.message ||
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan saat memeriksa tagihan";
      return NextResponse.json({ success: false, error: digiError }, { status: 400 });
    }
  } catch (error) {
    console.error("Pascabayar inquiry server error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
