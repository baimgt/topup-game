import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Voucher from "@/models/Voucher";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const vouchers = await Voucher.find({}).sort({ createdAt: -1 }).populate("gameId", "name iconUrl").lean();
    return NextResponse.json({ success: true, data: vouchers });
  } catch (error) {
    console.error("Get vouchers error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

const voucherSchema = z.object({
  code: z.string().min(2, "Kode promo minimal 2 karakter"),
  title: z.string().min(2, "Judul promo wajib diisi"),
  discountType: z.enum(["percent", "flat"]),
  discountValue: z.number().min(1, "Nilai diskon minimal 1"),
  minPurchase: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).default(0),
  usageLimit: z.number().min(0).default(1000),
  expiryDate: z.string().min(1, "Tanggal kedaluwarsa wajib diisi"),
  isActive: z.boolean().default(true),
  gameId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = voucherSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { code, title, discountType, discountValue, minPurchase, maxDiscount, usageLimit, expiryDate, isActive, gameId } = parsed.data;

    const cleanCode = code.trim().toUpperCase();
    const existing = await Voucher.findOne({ code: cleanCode });
    if (existing) {
      return NextResponse.json({ success: false, error: "Kode promo sudah ada, gunakan kode lain" }, { status: 400 });
    }

    const voucher = await Voucher.create({
      code: cleanCode,
      title,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      expiryDate: new Date(expiryDate),
      isActive,
      gameId: gameId ? gameId : undefined,
    });

    return NextResponse.json({ success: true, data: voucher, message: "Kode promo berhasil dibuat!" });
  } catch (error) {
    console.error("Create voucher error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
