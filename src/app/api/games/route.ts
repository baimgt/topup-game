import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Game from "@/models/Game";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isAdmin = searchParams.get("admin") === "1";

    // Admin bisa lihat semua game termasuk nonaktif
    const filter: Record<string, unknown> = isAdmin ? {} : { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const games = await Game.find(filter).sort({ sortOrder: 1 }).lean();

    // Attach products to each game
    const gamesWithProducts = await Promise.all(
      games.map(async (game) => {
        const products = await Product.find({ gameId: game._id, isActive: true })
          .sort({ sortOrder: 1 })
          .lean();
        const formattedProducts = products.map((p: any) => ({ ...p, id: p._id.toString() }));
        return { ...game, id: game._id.toString(), products: formattedProducts };
      })
    );

    return NextResponse.json({ success: true, data: gamesWithProducts });
  } catch (error) {
    console.error("Get games error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data game" }, { status: 500 });
  }
}

const createGameSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.string().min(1),
  statusCategory: z.string().optional(),
  sortOrder: z.number().optional(),
  isCheckAccountSupported: z.boolean().optional(),
  targetInputs: z.array(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
  })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createGameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const game = await Game.create(parsed.data);
    return NextResponse.json({ success: true, data: game }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Slug sudah digunakan" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Gagal membuat game" }, { status: 500 });
  }
}
