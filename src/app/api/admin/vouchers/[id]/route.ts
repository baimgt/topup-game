import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Voucher from "@/models/Voucher";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return NextResponse.json({ success: false, error: "Voucher tidak ditemukan" }, { status: 404 });
    }

    if (typeof body.isActive === "boolean") voucher.isActive = body.isActive;
    if (body.title) voucher.title = body.title;
    if (body.discountType) voucher.discountType = body.discountType;
    if (typeof body.discountValue === "number") voucher.discountValue = body.discountValue;
    if (typeof body.minPurchase === "number") voucher.minPurchase = body.minPurchase;
    if (typeof body.maxDiscount === "number") voucher.maxDiscount = body.maxDiscount;
    if (typeof body.usageLimit === "number") voucher.usageLimit = body.usageLimit;
    if (body.expiryDate) voucher.expiryDate = new Date(body.expiryDate);
    if (body.gameId !== undefined) voucher.gameId = body.gameId || undefined;

    await voucher.save();

    return NextResponse.json({ success: true, data: voucher, message: "Voucher berhasil diupdate!" });
  } catch (error) {
    console.error("Update voucher error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await Voucher.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Voucher tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Voucher berhasil dihapus!" });
  } catch (error) {
    console.error("Delete voucher error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
