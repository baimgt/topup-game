import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Game from "@/models/Game";
import Product from "@/models/Product";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const game = await Game.findOne({ slug, isActive: true }).lean();
    if (!game) {
      return NextResponse.json({ success: false, error: "Game tidak ditemukan" }, { status: 404 });
    }

    const products = await Product.find({ gameId: game._id, isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: { ...game, id: game._id.toString(), products },
    });
  } catch (error) {
    console.error("Get game error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data game" }, { status: 500 });
  }
}
