import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import DigiflazzProduct from "@/models/DigiflazzProduct";
import PaymentConfig from "@/models/PaymentConfig";
import { getUserFromRequest } from "@/lib/auth";
import axios from "axios";
import crypto from "crypto";

// ── GET: Baca dari DB (cepat, tidak hit Digiflazz) ──────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type     = searchParams.get("type") || "prepaid";
    const search   = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const brand    = searchParams.get("brand") || "";

    // Build filter
    const filter: Record<string, unknown> = { type };
    if (category) filter.category = category;
    // brand: exact match case-insensitive
    if (brand) filter.brand = { $regex: `^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
    if (search && !brand) {
      filter.$or = [
        { product_name: { $regex: search, $options: "i" } },
        { buyer_sku_code: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const products = await DigiflazzProduct.find(filter)
      .sort({ category: 1, product_name: 1 })
      .lean();

    // Cek kapan terakhir sync
    const lastSync = products.length > 0
      ? products.reduce((latest, p) =>
          new Date(p.syncedAt) > new Date(latest) ? p.syncedAt : latest,
          products[0].syncedAt
        )
      : null;

    // Group by category
    const grouped: Record<string, typeof products> = {};
    for (const p of products) {
      const cat = p.category || "Lainnya";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }

    return NextResponse.json({
      success: true,
      data: {
        products,
        grouped,
        total: products.length,
        categories: Object.keys(grouped).sort(),
        lastSync: lastSync ? new Date(lastSync).toISOString() : null,
        isEmpty: products.length === 0,
      },
    });
  } catch (error) {
    console.error("Get digiflazz products error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// ── POST: Sync dari Digiflazz API → simpan ke DB ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { type = "prepaid" } = await req.json().catch(() => ({}));

    // Ambil credentials
    const config = await PaymentConfig.findOne({});
    const username = config?.digiflazzUsername || process.env.DIGIFLAZZ_USERNAME || "";
    const apiKey   = config?.digiflazzApiKey   || process.env.DIGIFLAZZ_API_KEY   || "";

    if (!username || !apiKey || username === "your-digiflazz-username") {
      return NextResponse.json({
        success: false,
        error: "Konfigurasi Digiflazz belum diisi",
      }, { status: 400 });
    }

    // Hit Digiflazz API
    const sign = crypto
      .createHash("md5")
      .update(`${username}${apiKey}pricelist`)
      .digest("hex");

    let apiProducts: any[] = [];
    try {
      const res = await axios.post(
        "https://api.digiflazz.com/v1/price-list",
        { cmd: type, username, sign },
        { timeout: 20000, validateStatus: () => true }
      );

      const msg: string = res.data?.message || res.data?.data?.message || "";

      // Rate limit — kembalikan data DB yang ada
      if (msg.toLowerCase().includes("limitasi") || msg.toLowerCase().includes("coba beberapa saat")) {
        const count = await DigiflazzProduct.countDocuments({ type });
        return NextResponse.json({
          success: false,
          rateLimited: true,
          error: "Rate limit Digiflazz — tunggu beberapa menit lalu coba sync lagi",
          existingCount: count,
        }, { status: 429 });
      }

      // Pascabayar kadang mengembalikan object {data: [...]} atau langsung array
      let rawData = res.data?.data;
      if (!rawData && Array.isArray(res.data)) {
        rawData = res.data; // fallback: response langsung array
      }

      if (!rawData || !Array.isArray(rawData)) {
        // Log untuk debug
        console.error("Digiflazz unexpected response:", JSON.stringify(res.data).slice(0, 500));
        return NextResponse.json({
          success: false,
          error: msg || `Response tidak dikenal dari Digiflazz (HTTP ${res.status}). Pastikan akun Digiflazz Anda memiliki akses produk ${type === "pasca" ? "pascabayar" : "prabayar"}.`,
          debug: { status: res.status, dataType: typeof res.data, keys: res.data ? Object.keys(res.data) : [] },
        }, { status: 400 });
      }

      apiProducts = rawData;
    } catch (err: any) {
      if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
        return NextResponse.json({ success: false, error: "Timeout — periksa koneksi internet" }, { status: 504 });
      }
      throw err;
    }

    // Upsert ke MongoDB — update yang sudah ada, insert yang baru
    const syncedAt = new Date();
    let upserted = 0;

    const ops = apiProducts.map((p: any) => ({
      updateOne: {
        filter: { buyer_sku_code: p.buyer_sku_code },
        update: {
          $set: {
            product_name:          p.product_name          || "",
            category:              p.category              || "",
            brand:                 p.brand                 || "",
            type,
            seller_name:           p.seller_name           || "",
            desc:                  p.desc                  || "",
            buyer_product_status:  p.buyer_product_status  ?? false,
            seller_product_status: p.seller_product_status ?? false,
            syncedAt,
            // Prepaid-only fields (default 0/false jika pasca)
            price:                 p.price                 ?? 0,
            unlimited_stock:       p.unlimited_stock       ?? false,
            stock:                 p.stock                 ?? 0,
            multi:                 p.multi                 ?? false,
            start_cut_off:         p.start_cut_off         || "",
            end_cut_off:           p.end_cut_off           || "",
            // Pascabayar-only fields (default 0 jika prepaid)
            admin:                 p.admin                 ?? 0,
            commission:            p.commission            ?? 0,
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      const result = await DigiflazzProduct.bulkWrite(ops, { ordered: false });
      upserted = (result.upsertedCount || 0) + (result.modifiedCount || 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        synced: apiProducts.length,
        upserted,
        syncedAt: syncedAt.toISOString(),
        type,
      },
      message: `Sync berhasil — ${apiProducts.length} produk diperbarui`,
    });
  } catch (error) {
    console.error("Sync digiflazz products error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
