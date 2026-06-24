import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import FlashSale from "@/models/FlashSale";
// Ensure models are registered for populates
import "@/models/Product";
import "@/models/Game";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

const createFlashSaleSchema = z.object({
  productId: z.string().min(1, "Produk wajib diisi"),
  discountPrice: z.number().min(0, "Harga diskon tidak valid"),
  stockTotal: z.number().min(1, "Stok total tidak valid"),
  stockLeft: z.number().min(0, "Stok sisa tidak valid"),
  endTime: z.string().min(1, "Waktu berakhir wajib diisi"),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "1";

    const filter = isAdmin ? {} : { isActive: true, endTime: { $gt: new Date() } };
    
    const sales = await FlashSale.find(filter)
      .populate({
        path: "productId",
        populate: {
          path: "gameId",
          model: "Game"
        }
      })
      .lean();

    // Filter out items where populate failed (e.g. product/game deleted)
    const validSales = sales.filter(s => s.productId && (s.productId as any).gameId);
    
    const formatted = validSales.map((s: any) => ({
      id: s._id.toString(),
      productId: s.productId._id.toString(),
      productName: s.productId.name,
      originalPrice: s.productId.sellingPrice,
      discountPrice: s.discountPrice,
      stockTotal: s.stockTotal,
      stockLeft: s.stockLeft,
      endTime: s.endTime,
      isActive: s.isActive,
      gameName: s.productId.gameId.name,
      gameSlug: s.productId.gameId.slug,
      gameImageUrl: s.productId.gameId.imageUrl,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET flash-sales error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data flash sale" }, { status: 500 });
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
    const parsed = createFlashSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const flashSale = await FlashSale.create({
      ...parsed.data,
      endTime: new Date(parsed.data.endTime),
    });

    return NextResponse.json({ success: true, data: flashSale }, { status: 201 });
  } catch (error) {
    console.error("POST flash-sale error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat flash sale baru" }, { status: 500 });
  }
}
