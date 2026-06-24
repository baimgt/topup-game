import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Banner from "@/models/Banner";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

const updateBannerSchema = z.object({
  bannerType: z.enum(["text", "image"]).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  badge: z.string().optional(),
  discount: z.string().optional(),
  description: z.string().optional(),
  bgGradient: z.string().optional(),
  textColor: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
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
    const parsed = updateBannerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const banner = await Banner.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
    if (!banner) {
      return NextResponse.json({ success: false, error: "Banner tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error("PUT banner error:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui data banner" }, { status: 500 });
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
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return NextResponse.json({ success: false, error: "Banner tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Banner berhasil dihapus" });
  } catch (error) {
    console.error("DELETE banner error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus banner" }, { status: 500 });
  }
}
