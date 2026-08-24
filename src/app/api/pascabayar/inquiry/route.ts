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

// Helper untuk menghasilkan daftar kandidat SKU yang mungkin digunakan di Digiflazz
function getCandidateSkus(inputSku: string): string[] {
  const s = inputSku.toLowerCase().trim();
  const candidates: string[] = [inputSku];

  if (s.includes("pln")) {
    candidates.unshift("pln", "PLN");
    candidates.push("plnpascabayar", "pln-pasca", "plnpasca", "PLNPASCA", "PLNPOSTPAID");
  } else if (s.includes("bpjs")) {
    candidates.push("bpjs-kes", "bpjskesehatan", "bpjs", "BPJS");
  } else if (s.includes("telkom") || s.includes("indihome") || s.includes("speedy")) {
    candidates.push("telkom-pstn", "telkom", "indihome", "speedy");
  } else if (s.includes("pdam")) {
    candidates.push("pdam", "pdam-pasca");
  } else if (s.includes("halo")) {
    candidates.push("halo", "kartu-halo", "telkomsel-halo");
  } else if (s.includes("matrix")) {
    candidates.push("matrix", "indosat-matrix", "indosat-pasca");
  } else if (s.includes("xl")) {
    candidates.push("xl-prioritas", "xl-pasca");
  } else if (s.includes("fif")) {
    candidates.push("fif", "fif-group");
  } else if (s.includes("baf")) {
    candidates.push("baf");
  } else if (s.includes("wom")) {
    candidates.push("wom", "wom-finance");
  } else if (s.includes("pgn")) {
    candidates.push("pgn", "gas-negara");
  }

  return Array.from(new Set(candidates));
}

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

    const candidateSkus = Array.from(new Set([sku, ...getCandidateSkus(sku)]));
    let digiResult: any = null;
    let matchedSku = sku;
    let lastError: any = null;

    // Auto-detect test customer number (Digiflazz official test numbers: 530000000001, etc.)
    const isTestCustomerNo = customerNo.startsWith("53000000000");

    // Loop through candidate SKUs until one succeeds or a valid biller response is returned
    for (const candSku of candidateSkus) {
      const refId = generateRefId();
      try {
        console.log(`[Digiflazz Inquiry] Trying SKU: "${candSku}" | Customer: "${customerNo}" | Ref: "${refId}"`);
        const res = await inquiryPascabayar(candSku, customerNo, refId, {
          username,
          apiKey,
          testing: isTestCustomerNo,
        });

        console.log(`[Digiflazz Inquiry Res] SKU "${candSku}":`, JSON.stringify(res));

        if (res && res.status !== "Gagal" && (res.rc === "00" || res.price !== undefined)) {
          digiResult = res;
          matchedSku = candSku;
          break;
        } else if (res) {
          lastError = res;
          // Jika responnya BUKAN "SKU tidak ditemukan" (RC !== "43"), artinya SKU ini SUDAH VALID & DITERIMA BILLER!
          // Contoh: RC 60 ("Tagihan belum tersedia"), RC 17 ("Tagihan sudah lunas"), RC 14 ("ID Salah").
          // Maka jangan timpa dengan SKU lain yang tidak valid.
          if (res.rc && res.rc !== "43") {
            break;
          }
        }
      } catch (err: any) {
        lastError = err.response?.data?.data || err.response?.data || err;
        console.error(`[Digiflazz Inquiry Err] SKU "${candSku}":`, lastError);
      }
    }

    if (!digiResult) {
      let errorMsg = lastError?.message || "Gagal melakukan cek tagihan.";
      const isPaid =
        lastError?.rc === "60" ||
        lastError?.rc === "17" ||
        errorMsg.toLowerCase().includes("lunas") ||
        errorMsg.toLowerCase().includes("belum tersedia");

      if (lastError?.rc === "60") {
        errorMsg = "Tagihan belum tersedia atau sudah lunas untuk nomor pelanggan ini.";
      } else if (lastError?.rc === "17") {
        errorMsg = "Tagihan untuk nomor pelanggan ini sudah lunas terbayar.";
      }
      return NextResponse.json(
        {
          success: false,
          isPaid,
          error: errorMsg,
          rc: lastError?.rc,
          customerNo,
          productName,
        },
        { status: 400 }
      );
    }

    const billAmount = Number(digiResult.price) || 0;
    const billerAdminFee = Number(digiResult.admin) || 0;

    // Hitung margin keuntungan toko
    const finalAdminFee = Math.max(storeAdminFee, billerAdminFee);
    const totalPayable = billAmount > 0 ? billAmount + (finalAdminFee - billerAdminFee) : 0;

    // Extract desc details
    const descData = digiResult.desc || {};
    const tagihanDetail = descData.tagihan?.detail || [];
    const period = tagihanDetail[0]?.periode || descData.tarif || "-";
    const tariff = descData.tarif || "-";
    const daya = descData.daya || 0;
    const lembarTagihan = descData.lembar_tagihan || tagihanDetail.length || 1;
    const standMeter =
      descData.stand_meter ||
      (descData.meter_awal && descData.meter_akhir
        ? `${descData.meter_awal} - ${descData.meter_akhir}`
        : descData.standMeter || descData.meteran || "");
    const penalty = tagihanDetail.reduce(
      (sum: number, d: any) => sum + (Number(d.denda) || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        refId: digiResult.ref_id || generateRefId(),
        sku: matchedSku,
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
        standMeter,
        lembarTagihan,
        detail: tagihanDetail,
        rawDesc: descData,
        message: digiResult.message,
      },
    });
  } catch (error) {
    console.error("Pascabayar inquiry server error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
