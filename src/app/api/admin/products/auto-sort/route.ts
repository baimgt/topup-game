import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import Game from "@/models/Game";
import { getUserFromRequest } from "@/lib/auth";

// Helper untuk mengekstrak angka nominal dari nama produk (misal: "86 Diamonds" -> 86, "Weekly Diamond Pass" -> 999999)
function extractNominal(name: string): number {
  const match = name.match(/(\d+[\.,]?\d*)/);
  if (!match) return 999999; // Produk non-angka seperti Pass/Voucher diletakkan di bagian belakang atau sesuai harga
  return parseFloat(match[1].replace(/,/g, ""));
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { gameId, mode = "price_asc" } = body;

    let targetGameIds: string[] = [];

    if (gameId && gameId !== "all") {
      targetGameIds = [gameId];
    } else {
      const allGames = await Game.find({}).select("_id").lean();
      targetGameIds = allGames.map((g: any) => g._id.toString());
    }

    let totalUpdated = 0;

    for (const gId of targetGameIds) {
      const products = await Product.find({ gameId: gId }).lean();
      if (!products || products.length === 0) continue;

      // Sort products according to mode
      const sorted = [...products].sort((a: any, b: any) => {
        if (mode === "price_asc") {
          return a.sellingPrice - b.sellingPrice || a.price - b.price || a.name.localeCompare(b.name);
        } else if (mode === "price_desc") {
          return b.sellingPrice - a.sellingPrice || b.price - a.price;
        } else if (mode === "nominal_asc") {
          const nomA = extractNominal(a.name);
          const nomB = extractNominal(b.name);
          if (nomA !== nomB) return nomA - nomB;
          return a.sellingPrice - b.sellingPrice;
        } else if (mode === "name_asc") {
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        }
        return a.sellingPrice - b.sellingPrice;
      });

      // Prepare bulkWrite updates
      const bulkOps = sorted.map((product: any, idx: number) => ({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { sortOrder: idx + 1 } },
        },
      }));

      if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps);
        totalUpdated += bulkOps.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengurutkan otomatis ${totalUpdated} produk berdasarkan ${
        mode === "price_asc"
          ? "Harga Termurah ➔ Termahal"
          : mode === "nominal_asc"
          ? "Nominal Terkecil ➔ Terbesar"
          : mode === "name_asc"
          ? "Nama Produk (A-Z)"
          : "Harga"
      }!`,
      updatedCount: totalUpdated,
    });
  } catch (error: any) {
    console.error("Auto sort products error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal mengurutkan produk" }, { status: 500 });
  }
}
