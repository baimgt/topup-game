import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Game from "@/models/Game";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

const importSchema = z.object({
  gameId: z.string().min(1, "Game wajib dipilih"),
  marginType: z.enum(["flat", "percent"]),
  marginValue: z.number().min(0),
  products: z.array(z.object({
    buyer_sku_code: z.string(),
    product_name: z.string(),
    category: z.string(),
    brand: z.string(),
    price: z.number(),
    desc: z.string().optional(),
  })).min(1, "Pilih minimal 1 produk"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { gameId, marginType, marginValue, products } = parsed.data;

    // Validasi game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json({ success: false, error: "Game tidak ditemukan" }, { status: 404 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        // Cek apakah SKU sudah ada di game ini
        const existing = await Product.findOne({ gameId, digiflazzSku: p.buyer_sku_code });
        if (existing) {
          skipped++;
          continue;
        }

        // Hitung harga jual berdasarkan margin
        const sellingPrice = marginType === "percent"
          ? Math.ceil(p.price * (1 + marginValue / 100))
          : p.price + marginValue;

        await Product.create({
          gameId,
          name: p.product_name,
          description: p.desc || "",
          price: p.price,
          sellingPrice,
          digiflazzSku: p.buyer_sku_code,
          category: p.category,
          isActive: true,
          sortOrder: i,
        });

        imported++;
      } catch (err) {
        errors.push(`${p.product_name}: gagal disimpan`);
      }
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, errors },
      message: `${imported} produk berhasil diimport${skipped > 0 ? `, ${skipped} dilewati (sudah ada)` : ""}`,
    });
  } catch (error) {
    console.error("Import products error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
