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
    const requestedAdmin = searchParams.get("admin") === "1";

    // Validasi: mode admin hanya untuk pengguna dengan role ADMIN yang sudah login
    let isAdmin = false;
    if (requestedAdmin) {
      const user = getUserFromRequest(req);
      isAdmin = !!(user && user.role === "ADMIN");
    }

    // Admin bisa lihat semua game termasuk nonaktif; publik hanya lihat yang aktif
    const filter: Record<string, unknown> = isAdmin ? {} : { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const games = await Game.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();

    // Attach products to each game
    const gamesWithProducts = await Promise.all(
      games.map(async (game) => {
        const products = await Product.find({ gameId: game._id, isActive: true })
          .sort({ sortOrder: 1, sellingPrice: 1 })
          .lean();

        const formattedProducts = products.map((p: any) => {
          const base = { ...p, id: p._id.toString() };

          // Sembunyikan field sensitif dari publik
          if (!isAdmin) {
            delete base.price;          // harga modal (HPP) — rahasia bisnis
            delete base.digiflazzSku;   // SKU internal Digiflazz
          }

          return base;
        });

        const gameBase = { ...game, id: game._id.toString(), products: formattedProducts };

        // Sembunyikan field sensitif game dari publik
        if (!isAdmin) {
          delete (gameBase as any).checkUsernameSku; // SKU internal Digiflazz
        }

        return gameBase;
      })
    );

    const sortedGames = gamesWithProducts.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

    return NextResponse.json({ success: true, data: sortedGames });
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
  bannerUrl: z.string().optional(),
  iconUrl: z.string().optional(),
  category: z.string().min(1),
  statusCategory: z.string().optional(),
  sortOrder: z.number().optional(),
  homeSortOrder: z.number().optional(),
  isCheckAccountSupported: z.boolean().optional(),
  targetFormat: z.string().optional(),
  categoryOrder: z.array(z.string()).optional(),
  targetInputs: z.array(z.object({
    name: z.string().min(1),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    type: z.string().min(1),
    options: z.array(z.object({
      label: z.string().optional(),
      value: z.string().min(1),
    })).optional(),
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
