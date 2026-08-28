import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Voucher from "@/models/Voucher";
import Product from "@/models/Product";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { code, gameId, price, productId } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ success: false, error: "Kode promo wajib diisi" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const voucher = await Voucher.findOne({ code: cleanCode });

    if (!voucher) {
      return NextResponse.json({ success: false, error: "Kode promo tidak ditemukan" }, { status: 404 });
    }

    if (!voucher.isActive) {
      return NextResponse.json({ success: false, error: "Kode promo sudah tidak aktif" }, { status: 400 });
    }

    if (new Date() > new Date(voucher.expiryDate)) {
      return NextResponse.json({ success: false, error: "Kode promo telah kedaluwarsa" }, { status: 400 });
    }

    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return NextResponse.json({ success: false, error: "Kuota voucher telah habis" }, { status: 400 });
    }

    if (voucher.gameId && gameId && voucher.gameId.toString() !== gameId.toString()) {
      return NextResponse.json({ success: false, error: "Voucher ini tidak berlaku untuk game yang dipilih" }, { status: 400 });
    }

    // ── SECURITY: Ambil harga dari DB, JANGAN percaya dari client ────────
    let itemPrice = 0;
    if (productId) {
      const product = await Product.findById(productId).lean();
      if (product) {
        // Cek apakah ada flash sale aktif
        const FlashSale = (await import("@/models/FlashSale")).default;
        const activeFlashSale = await FlashSale.findOne({
          productId: product._id,
          isActive: true,
          endTime: { $gt: new Date() },
          stockLeft: { $gt: 0 },
        });
        itemPrice = activeFlashSale ? activeFlashSale.discountPrice : (product as any).sellingPrice;
      }
    }
    // Fallback ke price dari client HANYA jika productId tidak diberikan (backward compat)
    if (!itemPrice && price) {
      itemPrice = Number(price) || 0;
    }

    if (voucher.minPurchase > 0 && itemPrice < voucher.minPurchase) {
      return NextResponse.json({
        success: false,
        error: `Minimal transaksi untuk voucher ini adalah Rp ${voucher.minPurchase.toLocaleString("id-ID")}`
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === "flat") {
      discountAmount = voucher.discountValue;
    } else {
      discountAmount = Math.round((itemPrice * voucher.discountValue) / 100);
      if (voucher.maxDiscount > 0 && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    }

    // Ensure discount doesn't exceed item price
    if (discountAmount > itemPrice) {
      discountAmount = itemPrice;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: voucher.code,
        title: voucher.title,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discountAmount,
        finalPrice: Math.max(0, itemPrice - discountAmount),
      },
      message: `Voucher berhasil digunakan! Diskon Rp ${discountAmount.toLocaleString("id-ID")}`,
    });
  } catch (error) {
    console.error("Validate voucher error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

