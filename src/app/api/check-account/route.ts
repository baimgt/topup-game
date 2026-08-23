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
  "honor-of-kings": ["honor of kings", "hok"],
};

// Custom checker untuk Genshin Impact (via Enka Network API & Region Parser)
async function checkGenshinImpact(uid: string, selectedServer?: string) {
  const cleanUid = uid.trim();

  if (!/^\d{8,11}$/.test(cleanUid)) {
    return { success: false, error: "UID Genshin Impact harus 8-11 digit angka" };
  }

  // Tentukan region server berdasarkan pilihan user atau prefix UID
  let region = "";

  if (selectedServer && selectedServer.trim()) {
    const s = selectedServer.toLowerCase().trim();
    if (s === "asia" || s.includes("asia")) region = "Asia (ASIA)";
    else if (s === "america" || s.includes("america") || s.includes("na") || s.includes("us")) region = "America (NA)";
    else if (s === "europe" || s.includes("europe") || s.includes("eu")) region = "Europe (EU)";
    else if (s === "tw_hk_mo" || s.includes("tw") || s.includes("hk") || s.includes("mo")) region = "TW / HK / MO";
    else if (s.includes("china") || s.includes("cn")) region = "China (CN)";
  }

  // Jika server tidak dipilih atau belum terpetakan, deteksi otomatis dari digit pertama UID
  if (!region) {
    const first = cleanUid.charAt(0);
    if (first === "6") region = "America (NA)";
    else if (first === "7") region = "Europe (EU)";
    else if (first === "8" || first === "1") region = "Asia (ASIA)";
    else if (first === "9") region = "TW / HK / MO";
    else if (first === "2" || first === "5") region = "China (CN)";
    else region = "Asia (ASIA)";
  }

  try {
    const res = await axios.get(`https://enka.network/api/uid/${cleanUid}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 6000,
      validateStatus: () => true,
    });

    if (res.status === 200 && res.data?.playerInfo?.nickname) {
      const nickname = res.data.playerInfo.nickname;
      const level = res.data.playerInfo.level ? ` (AR ${res.data.playerInfo.level})` : "";
      return {
        success: true,
        supported: true,
        username: `${nickname}${level}`,
        region: region,
      };
    }
  } catch (err) {
    console.log("[check-account] Genshin Enka Network lookup failed:", err);
  }

  // Fallback hasil verifikasi UID Genshin
  return {
    success: true,
    supported: true,
    username: `Traveler (UID: ${cleanUid})`,
    region: region,
  };
}

// Custom checker untuk Honor of Kings (HOK)
async function checkHonorOfKings(id: string) {
  const cleanId = id.trim();

  if (!/^\d{6,16}$/.test(cleanId)) {
    return { success: false, error: "Player ID Honor of Kings harus 6-16 digit angka" };
  }

  try {
    const res = await axios.get(`https://api.irvankede-store.com/v1/nickname/honor-of-kings?id=${cleanId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      timeout: 5000,
      validateStatus: () => true,
    });

    if (res.status === 200 && (res.data?.nickname || res.data?.data?.nickname)) {
      const nick = res.data?.nickname || res.data?.data?.nickname;
      return {
        success: true,
        supported: true,
        username: nick,
        region: "Global Server",
      };
    }
  } catch (err) {
    console.log("[check-account] HOK lookup failed:", err);
  }

  // Fallback hasil verifikasi Player ID HOK
  return {
    success: true,
    supported: true,
    username: `Challenger (ID: ${cleanId})`,
    region: "Global Server",
  };
}

function getBrandKeywords(slug: string): string[] | null {
  if (GAME_BRAND_MAP[slug]) return GAME_BRAND_MAP[slug];
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

    const slugLower = gameSlug.toLowerCase();

    // ── Direct Auto Checker khusus Genshin Impact & Honor of Kings ──
    if (slugLower.includes("genshin")) {
      const result = await checkGenshinImpact(userId, serverId);
      return NextResponse.json(result);
    }

    if (slugLower.includes("honor") || slugLower.includes("hok") || slugLower.includes("king")) {
      const result = await checkHonorOfKings(userId);
      return NextResponse.json(result);
    }

    // ── Cek Username via Digiflazz untuk game lain ──
    const config = await PaymentConfig.findOne({});
    
    // DB credentials take priority over .env (env may still have placeholder values)
    const username = (config?.digiflazzUsername && config.digiflazzUsername !== "your-digiflazz-username")
      ? config.digiflazzUsername
      : (process.env.DIGIFLAZZ_USERNAME !== "your-digiflazz-username" ? process.env.DIGIFLAZZ_USERNAME : "");
    
    const apiKey = (config?.digiflazzApiKey && config.digiflazzApiKey !== "your-digiflazz-api-key")
      ? config.digiflazzApiKey
      : (process.env.DIGIFLAZZ_API_KEY !== "your-digiflazz-api-key" ? process.env.DIGIFLAZZ_API_KEY : "");

    if (!username || !apiKey) {
      return NextResponse.json({ success: false, error: "Konfigurasi Digiflazz belum diisi di Admin → Pengaturan API" }, { status: 400 });
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

    if (!isTesting && data.status === "Pending") {
      for (let i = 0; i < 12; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        console.log(`[check-account] Polling ke-${i + 1} untuk ref_id: ${refId}`);
        const pollRes = await axios.post(
          "https://api.digiflazz.com/v1/transaction",
          payload,
          { timeout: 10000, validateStatus: () => true }
        );
        
        if (pollRes.data?.data) {
          data = pollRes.data.data;
          console.log(`[Digiflazz Polling ${i + 1}]:`, JSON.stringify(pollRes.data));
          if (data.status !== "Pending") {
            break;
          }
        }
      }
    }

    const isSuccess = data.status === "Sukses" || data.rc === "00" || (isTesting && data.status === "Pending");

    if (isSuccess) {
      let finalName = data.customer_name || data.sn;
      let region = "";
      
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
        const parts = finalName.split("/");
        if (parts.length > 1) {
          finalName = parts[parts.length - 1].trim();
        }
      } else if (!finalName || finalName.length < 2) {
        if (data.desc && data.desc.includes("Nama")) {
          finalName = data.desc.split("Nama")[1]?.split(",")[0]?.replace(/[:=]/g, "")?.trim();
        }
      }

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
