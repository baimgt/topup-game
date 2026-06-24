import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PaymentConfig from "@/models/PaymentConfig";
import GameModel from "@/models/Game";
import DigiflazzProduct from "@/models/DigiflazzProduct";
import axios from "axios";
import crypto from "crypto";

// Fallback: cari SKU cek username dari DB jika game tidak punya checkUsernameSku
const GAME_BRAND_MAP: Record<string, string[]> = {
  "mobile-legends": ["mobile legends", "mobilelegend", "mlbb"],
  "free-fire":      ["free fire", "freefire"],
  "pubg-mobile":    ["pubg"],
  "genshin-impact": ["genshin"],
  "valorant":       ["valorant"],
};

function getBrandKeywords(slug: string): string[] | null {
  if (GAME_BRAND_MAP[slug]) return GAME_BRAND_MAP[slug];
  // Partial match
  for (const [key, kws] of Object.entries(GAME_BRAND_MAP)) {
    if (slug.includes(key.split("-")[0]) || key.includes(slug.split("-")[0])) return kws;
  }
  return null;
}

async function findCheckSkuFromDB(gameSlug: string): Promise<string | null> {
  const brandKws = getBrandKeywords(gameSlug);
  if (!brandKws) return null;
  for (const kw of brandKws) {
    const p = await DigiflazzProduct.findOne({
      brand: { $regex: kw, $options: "i" },
      product_name: { $regex: "cek|check", $options: "i" },
      buyer_product_status: true,
    }).lean();
    if (p) return p.buyer_sku_code;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { gameSlug, userId, serverId } = await req.json();

    if (!gameSlug || !userId) {
      return NextResponse.json({ success: false, error: "Game dan User ID wajib diisi" }, { status: 400 });
    }

    const config = await PaymentConfig.findOne({});
    const username = config?.digiflazzUsername || process.env.DIGIFLAZZ_USERNAME || "";
    const apiKey   = config?.digiflazzApiKey   || process.env.DIGIFLAZZ_API_KEY   || "";

    if (!username || !apiKey || username === "your-digiflazz-username") {
      return NextResponse.json({ success: false, error: "Konfigurasi Digiflazz belum diisi" }, { status: 400 });
    }

    // 1. Cek apakah admin mengaktifkan fitur ini
    const game = await GameModel.findOne({ slug: gameSlug }).lean();
    if (!game || !game.isCheckAccountSupported) {
      return NextResponse.json({ success: true, supported: false });
    }

    // 2. Ambil checkUsernameSku dari model Game (sudah tersimpan saat import)
    let skuInquiry = game?.checkUsernameSku || "";

    // 3. Jika belum ada di game, cari dari DB Digiflazz (fallback)
    if (!skuInquiry) {
      skuInquiry = (await findCheckSkuFromDB(gameSlug)) || "";
      // Simpan ke game untuk request berikutnya
      if (skuInquiry && game) {
        await GameModel.findByIdAndUpdate(game._id, { checkUsernameSku: skuInquiry });
      }
    }

    if (!skuInquiry) {
      return NextResponse.json({ success: true, supported: false });
    }

    const isTesting = process.env.DIGIFLAZZ_TESTING === "true";
    const checkLive = process.env.DIGIFLAZZ_CHECK_LIVE === "true";

    console.log(`[check-account] isTesting=${isTesting}, checkLive=${checkLive}, skuInquiry="${skuInquiry}", gameSlug="${gameSlug}"`);

    // Mode testing DAN tidak ada flag check_live → simulasi dummy
    if (isTesting && !checkLive) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({
        success: true,
        supported: true,
        username: `[TEST] User ${userId}`,
        message: "Mode testing aktif — set DIGIFLAZZ_CHECK_LIVE=true untuk cek username nyata",
      });
    }

    const customerNo = serverId ? `${userId}${serverId}` : userId;
    const refId = `CHK${Date.now()}`;
    const sign = crypto.createHash("md5").update(`${username}${apiKey}${refId}`).digest("hex");

    const payload: any = { username, buyer_sku_code: skuInquiry, customer_no: customerNo, ref_id: refId, sign };
    if (isTesting) payload.testing = true;

    const res = await axios.post(
      "https://api.digiflazz.com/v1/transaction",
      payload,
      { timeout: 10000, validateStatus: () => true }
    );

    let data = res.data?.data;
    console.log("[Digiflazz Check Response]:", JSON.stringify(res.data));

    if (!data) {
      return NextResponse.json({ success: false, error: res.data?.message || "Gagal mengecek akun" });
    }

    // Jika di Production dan statusnya Pending, Digiflazz kadang butuh waktu beberapa detik.
    // Kita lakukan polling (cek ulang) maksimal 12 kali dengan jeda 800 ms.
    if (!isTesting && data.status === "Pending") {
      for (let i = 0; i < 12; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        console.log(`[check-account] Polling ke-${i + 1} untuk ref_id: ${refId}`);
        const pollRes = await axios.post(
          "https://api.digiflazz.com/v1/transaction",
          payload, // Payload yang persis sama dengan ref_id yang sama akan mengembalikan status terbaru
          { timeout: 10000, validateStatus: () => true }
        );
        
        if (pollRes.data?.data) {
          data = pollRes.data.data;
          console.log(`[Digiflazz Polling ${i + 1}]:`, JSON.stringify(pollRes.data));
          if (data.status !== "Pending") {
            break; // Jika sudah Sukses atau Gagal, keluar dari loop
          }
        }
      }
    }

    const isSuccess = data.status === "Sukses" || data.rc === "00" || (isTesting && data.status === "Pending");

    if (isSuccess) {
      // Ekstrak nama dari desc jika sn kosong (beberapa game menaruh nama di desc)
      let finalName = data.customer_name || data.sn;
      let region = "";
      
      // Parse khusus untuk balasan Digiflazz seperti: "User ID ... / Username DREAMY / Region = ID"
      if (finalName && finalName.includes("Username")) {
        const parts = finalName.split("/");
        for (const p of parts) {
          if (p.includes("Username")) {
            finalName = p.split("Username")[1]?.replace(/[=:]/g, "")?.trim() || finalName;
          } else if (p.includes("Region")) {
            region = p.split("Region")[1]?.replace(/[=:]/g, "")?.trim() || "";
          }
        }
      } else if (finalName && finalName.includes("ID") && finalName.includes("/")) {
        // Format seperti "ID 1212700988 / ~auranoxs~"
        const parts = finalName.split("/");
        if (parts.length > 1) {
          finalName = parts[parts.length - 1].trim();
        }
      } else if (!finalName || finalName.length < 2) {
        if (data.desc && data.desc.includes("Nama")) {
          // Parsing sederhana dari desc
          finalName = data.desc.split("Nama")[1]?.split(",")[0]?.replace(/[:=]/g, "")?.trim();
        }
      }

      // Jika di Sandbox, Digiflazz selalu return Pending dan sn kosong.
      if (isTesting && data.status === "Pending" && (!finalName || finalName === "")) {
        finalName = "Tuan Krabs (Sandbox)";
      }

      return NextResponse.json({
        success: true,
        supported: true,
        username: finalName || data.desc || "Akun ditemukan",
        region: region || undefined,
      });
    }

    if (["14", "40", "20"].includes(data.rc)) {
      return NextResponse.json({ success: false, error: "Akun tidak ditemukan. Periksa ID yang dimasukkan." });
    }

    return NextResponse.json({ success: false, error: data.message || "Akun tidak dapat diverifikasi" });
  } catch (err: any) {
    if (err.code === "ECONNABORTED") {
      return NextResponse.json({ success: false, error: "Timeout saat mengecek akun" }, { status: 504 });
    }
    return NextResponse.json({ success: false, error: "Gagal mengecek akun" }, { status: 500 });
  }
}
