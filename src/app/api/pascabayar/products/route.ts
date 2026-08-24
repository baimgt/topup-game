import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import DigiflazzProduct from "@/models/DigiflazzProduct";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

// Daftar produk pascabayar populer bawaan jika database belum disinkronkan
const DEFAULT_PASCA_PRODUCTS = [
  {
    buyer_sku_code: "pln-pasca",
    product_name: "PLN Pascabayar (Tagihan Listrik)",
    category: "PLN",
    brand: "PLN",
    admin: 2500,
    commission: 1000,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "bpjs-kes",
    product_name: "BPJS Kesehatan",
    category: "BPJS",
    brand: "BPJS Kesehatan",
    admin: 2500,
    commission: 800,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "telkom-pstn",
    product_name: "Telkom / Indihome / Speedy",
    category: "Internet & TV",
    brand: "Telkom",
    admin: 2500,
    commission: 1000,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "pdam",
    product_name: "PDAM Seluruh Indonesia",
    category: "PDAM",
    brand: "PDAM",
    admin: 2500,
    commission: 750,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "halo",
    product_name: "Kartu Halo (Telkomsel Pascabayar)",
    category: "HP Pascabayar",
    brand: "Telkomsel Halo",
    admin: 1500,
    commission: 500,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "matrix",
    product_name: "Indosat Postpaid (Matrix)",
    category: "HP Pascabayar",
    brand: "Indosat Matrix",
    admin: 1500,
    commission: 500,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "xl-prioritas",
    product_name: "XL Prioritas (Pascabayar)",
    category: "HP Pascabayar",
    brand: "XL Prioritas",
    admin: 1500,
    commission: 500,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "fif",
    product_name: "FIF Group (Multifinance)",
    category: "Multifinance",
    brand: "FIF",
    admin: 2500,
    commission: 1000,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "baf",
    product_name: "BAF (Bussan Auto Finance)",
    category: "Multifinance",
    brand: "BAF",
    admin: 2500,
    commission: 1000,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "wom",
    product_name: "WOM Finance",
    category: "Multifinance",
    brand: "WOM",
    admin: 2500,
    commission: 1000,
    buyer_product_status: true,
  },
  {
    buyer_sku_code: "pgn",
    product_name: "PGN (Perusahaan Gas Negara)",
    category: "Gas Negara",
    brand: "PGN",
    admin: 2500,
    commission: 1000,
    buyer_product_status: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    const setting = await Setting.findOne().lean();
    const defaultStoreAdminFee = setting?.pascabayarAdminFee ?? 2500;

    let dbProducts = await DigiflazzProduct.find({ type: "pasca" })
      .sort({ category: 1, product_name: 1 })
      .lean();

    // Gunakan fallback default jika DB masih kosong
    let productsList = dbProducts.length > 0 ? dbProducts : DEFAULT_PASCA_PRODUCTS;

    if (category && category !== "ALL") {
      productsList = productsList.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const q = search.toLowerCase();
      productsList = productsList.filter(
        (p) =>
          p.product_name?.toLowerCase().includes(q) ||
          p.buyer_sku_code?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q)
      );
    }

    // Grouping per kategori
    const grouped: Record<string, any[]> = {};
    for (const p of productsList) {
      const cat = p.category || "Lainnya";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }

    const categories = Object.keys(grouped).sort();

    return NextResponse.json({
      success: true,
      data: {
        products: productsList,
        grouped,
        categories,
        total: productsList.length,
        defaultAdminFee: defaultStoreAdminFee,
      },
    });
  } catch (error) {
    console.error("Get pascabayar products error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat produk pascabayar" },
      { status: 500 }
    );
  }
}
