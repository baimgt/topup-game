import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Banner from "@/models/Banner";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

const createBannerSchema = z.object({
  bannerType: z.enum(["text", "image"]).default("text"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  badge: z.string().optional().default("Promo"),
  discount: z.string().optional(),
  description: z.string().optional(),
  bgGradient: z.string().optional(),
  textColor: z.string().optional().default("text-blue-400"),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "1";

    const filter = isAdmin ? {} : { isActive: true };
    const banners = await Banner.find(filter).sort({ sortOrder: 1 }).lean();

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    console.error("GET banners error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data banner" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createBannerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const banner = await Banner.create(parsed.data);
    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch (error) {
    console.error("POST banner error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat banner baru" }, { status: 500 });
  }
}
