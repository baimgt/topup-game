import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Game from "@/models/Game";
import Product from "@/models/Product";
import DigiflazzProduct from "@/models/DigiflazzProduct";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

// Kata kunci yang menandakan produk ini adalah untuk cek username, BUKAN produk jual
const CHECK_KEYWORDS = [
  "cek username", "cek user", "check username", "check user",
  "cek akun", "check account", "cek id", "check id",
  "username check", "cek nama",
];

function isCheckUsernameSku(productName: string): boolean {
  const lower = productName.toLowerCase();
  return CHECK_KEYWORDS.some((kw) => lower.includes(kw));
}

const schema = z.object({
  brand: z.string().min(1),
  gameName: z.string().min(1),
  gameSlug: z.string().min(1),
  gameCategory: z.string().min(1),
  gameDescription: z.string().optional(),
  marginType: z.enum(["flat", "percent"]),
  marginValue: z.number().min(0),
  selectedSkus: z.array(z.string()).min(1, "Pilih minimal 1 produk"),
  checkUsernameSku: z.string().optional(), // SKU cek username yang sudah dideteksi di frontend
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      brand, gameName, gameSlug, gameCategory, gameDescription,
      marginType, marginValue, selectedSkus, checkUsernameSku,
    } = parsed.data;

    // Buat atau update game
    let game = await Game.findOne({ slug: gameSlug });
    if (!game) {
      game = await Game.create({
        name: gameName,
        slug: gameSlug,
        description: gameDescription || `Top up ${gameName} murah dan cepat`,
        category: gameCategory,
        isActive: true,
        sortOrder: 0,
        checkUsernameSku: checkUsernameSku || "",
      });
    } else {
      // Update checkUsernameSku jika ada yang baru
      if (checkUsernameSku) {
        game.checkUsernameSku = checkUsernameSku;
        await game.save();
      }
    }

    // Ambil produk Digiflazz yang dipilih dari DB
    const digiProducts = await DigiflazzProduct.find({
      buyer_sku_code: { $in: selectedSkus },
    }).lean();

    console.log(`[import-game] selectedSkus: ${selectedSkus.length}, found in DB: ${digiProducts.length}`);

    if (digiProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Tidak ada produk ditemukan di database untuk SKU yang dipilih. Pastikan sudah sync produk Digiflazz. SKU sample: ${selectedSkus.slice(0, 3).join(", ")}`,
      }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let checkSkuDetected = "";

    for (let i = 0; i < digiProducts.length; i++) {
      const p = digiProducts[i];

      // Cek apakah ini produk cek username — jangan jadikan produk jual
      if (isCheckUsernameSku(p.product_name)) {
        checkSkuDetected = p.buyer_sku_code;
        console.log(`[import-game] Detected check username SKU: ${p.buyer_sku_code} (${p.product_name}) — tidak diimport sebagai produk`);
        continue;
      }

      const exists = await Product.findOne({ gameId: game._id, digiflazzSku: p.buyer_sku_code });
      if (exists) { skipped++; continue; }

      const sellingPrice = marginType === "percent"
        ? Math.ceil(p.price * (1 + marginValue / 100))
        : p.price + marginValue;

      await Product.create({
        gameId: game._id,
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
    }

    // Simpan SKU cek username yang terdeteksi ke game
    if (checkSkuDetected && !game.checkUsernameSku) {
      await Game.findByIdAndUpdate(game._id, { checkUsernameSku: checkSkuDetected });
    }

    return NextResponse.json({
      success: true,
      data: {
        gameId: game._id,
        gameName: game.name,
        imported,
        skipped,
        checkUsernameSku: checkSkuDetected || game.checkUsernameSku || "",
      },
      message: imported > 0
        ? `Game "${game.name}" berhasil — ${imported} produk ditambahkan${skipped > 0 ? `, ${skipped} sudah ada` : ""}${checkSkuDetected ? ` (SKU cek username: ${checkSkuDetected})` : ""}`
        : `Semua ${skipped} produk sudah ada di game "${game.name}"`,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Slug game sudah digunakan" }, { status: 400 });
    }
    console.error("Import game error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
