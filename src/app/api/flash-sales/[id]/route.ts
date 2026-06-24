import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import FlashSale from "@/models/FlashSale";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

const updateFlashSaleSchema = z.object({
  discountPrice: z.number().min(0, "Harga diskon tidak valid").optional(),
  stockTotal: z.number().min(1, "Stok total tidak valid").optional(),
  stockLeft: z.number().min(0, "Stok sisa tidak valid").optional(),
  endTime: z.string().min(1, "Waktu berakhir tidak valid").optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateFlashSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = { ...parsed.data };
    if (parsed.data.endTime) {
      updateData.endTime = new Date(parsed.data.endTime);
    }

    const flashSale = await FlashSale.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!flashSale) {
      return NextResponse.json({ success: false, error: "Flash sale tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: flashSale });
  } catch (error) {
    console.error("PUT flash-sale error:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui data flash sale" }, { status: 500 });
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
    const flashSale = await FlashSale.findByIdAndDelete(id);
    if (!flashSale) {
      return NextResponse.json({ success: false, error: "Flash sale tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Flash sale berhasil dihapus" });
  } catch (error) {
    console.error("DELETE flash-sale error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus flash sale" }, { status: 500 });
  }
}
