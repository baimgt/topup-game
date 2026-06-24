import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PaymentConfig from "@/models/PaymentConfig";
import { getUserFromRequest } from "@/lib/auth";
import axios from "axios";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await req.json();

    // Ambil dari DB dulu, fallback ke env
    const config = await PaymentConfig.findOne({});

    const digiUsername = config?.digiflazzUsername || process.env.DIGIFLAZZ_USERNAME || "";
    const digiApiKey   = config?.digiflazzApiKey   || process.env.DIGIFLAZZ_API_KEY   || "";
    const midServerKey = config?.midtransServerKey || process.env.MIDTRANS_SERVER_KEY  || "";
    const midClientKey = config?.midtransClientKey || process.env.MIDTRANS_CLIENT_KEY  || "";
    const midIsProd    = config?.midtransIsProduction ?? (process.env.MIDTRANS_IS_PRODUCTION === "true");

    if (provider === "midtrans") {
      return await testMidtrans(midServerKey, midIsProd);
    }

    if (provider === "digiflazz") {
      return await testDigiflazz(digiUsername, digiApiKey);
    }

    return NextResponse.json({ success: false, error: "Provider tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

async function testMidtrans(serverKey: string, isProduction: boolean) {
  if (!serverKey) {
    return NextResponse.json({ success: false, error: "Server key belum diisi di konfigurasi atau .env" });
  }
  if (serverKey === "your-midtrans-server-key") {
    return NextResponse.json({ success: false, error: "Server key masih placeholder — isi dengan key asli dari Midtrans Dashboard" });
  }

  try {
    const baseUrl = isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
    const encoded = Buffer.from(`${serverKey}:`).toString("base64");

    const res = await axios.get(`${baseUrl}/v2/charge`, {
      headers: { Authorization: `Basic ${encoded}` },
      validateStatus: () => true,
      timeout: 8000,
    });

    if (res.status === 401) {
      return NextResponse.json({ success: false, error: "Server key salah atau tidak valid" });
    }

    return NextResponse.json({
      success: true,
      message: `Koneksi Midtrans berhasil (${isProduction ? "Production" : "Sandbox"})`,
      details: { mode: isProduction ? "Production" : "Sandbox", httpStatus: res.status },
    });
  } catch (err: any) {
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return NextResponse.json({ success: false, error: "Timeout — periksa koneksi internet server" });
    }
    return NextResponse.json({ success: false, error: `Gagal terhubung ke Midtrans: ${err.message}` });
  }
}

async function testDigiflazz(username: string, apiKey: string) {
  // Validasi isi
  if (!username || !apiKey) {
    return NextResponse.json({
      success: false,
      error: "Username atau API key kosong — isi di halaman Konfigurasi API atau file .env",
    });
  }
  if (username === "your-digiflazz-username" || apiKey === "your-digiflazz-api-key") {
    return NextResponse.json({
      success: false,
      error: "Masih menggunakan nilai placeholder — ganti dengan username dan API key asli dari Digiflazz",
    });
  }
  if (apiKey.includes("****")) {
    return NextResponse.json({
      success: false,
      error: "API key ter-mask — simpan ulang konfigurasi dengan key asli",
    });
  }

  try {
    const sign = crypto
      .createHash("md5")
      .update(`${username}${apiKey}pricelist`)
      .digest("hex");

    const res = await axios.post(
      "https://api.digiflazz.com/v1/price-list",
      { cmd: "prepaid", username, sign },
      { timeout: 12000, validateStatus: () => true }
    );

    // Sukses — dapat array produk
    if (res.data?.data && Array.isArray(res.data.data)) {
      return NextResponse.json({
        success: true,
        message: `Koneksi Digiflazz berhasil — ${res.data.data.length} produk tersedia`,
        details: { username, productCount: res.data.data.length },
      });
    }

    const rc  = res.data?.rc;
    const msg: string = res.data?.message || res.data?.data?.message || "";

    // Rate limit — koneksi sebenarnya sudah OK, credentials valid
    if (msg.toLowerCase().includes("limitasi") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("coba beberapa saat")) {
      return NextResponse.json({
        success: true,
        message: "Koneksi Digiflazz berhasil ✓ (credentials valid)",
        details: {
          username,
          note: "Rate limit pricelist — tunggu beberapa menit sebelum test lagi",
        },
      });
    }

    if (rc === "10" || res.status === 401) {
      return NextResponse.json({ success: false, error: "Username atau API key salah" });
    }
    if (rc === "20") {
      return NextResponse.json({ success: false, error: "IP tidak terdaftar di whitelist Digiflazz — tambahkan IP server kamu" });
    }
    if (msg.toLowerCase().includes("ip")) {
      return NextResponse.json({ success: false, error: `IP tidak diizinkan: ${msg}` });
    }

    return NextResponse.json({
      success: false,
      error: `Response Digiflazz: rc=${rc || "-"}, message="${msg || JSON.stringify(res.data)}"`,
    });
  } catch (err: any) {
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return NextResponse.json({ success: false, error: "Timeout — periksa koneksi internet server" });
    }
    if (err.response?.data) {
      const d = err.response.data;
      const msg = d?.message || d?.data?.message || JSON.stringify(d);
      if (msg.toLowerCase().includes("ip")) {
        return NextResponse.json({ success: false, error: `IP tidak diizinkan oleh Digiflazz: ${msg}` });
      }
      return NextResponse.json({ success: false, error: `Error dari Digiflazz: ${msg}` });
    }
    return NextResponse.json({ success: false, error: `Gagal terhubung: ${err.message}` });
  }
}
