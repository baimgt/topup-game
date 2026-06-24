import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import DigiflazzProduct from "@/models/DigiflazzProduct";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "prepaid";

    // Ambil semua brand unik beserta jumlah produk & kategori
    const brands = await DigiflazzProduct.aggregate([
      { $match: { type, buyer_product_status: true } },
      {
        $group: {
          _id: "$brand",
          productCount: { $sum: 1 },
          categories: { $addToSet: "$category" },
          sampleProducts: { $push: { sku: "$buyer_sku_code", name: "$product_name", price: "$price" } },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          brand: "$_id",
          productCount: 1,
          categories: 1,
          // Ambil max 3 sample
          sampleProducts: { $slice: ["$sampleProducts", 3] },
        },
      },
    ]);

    return NextResponse.json({ success: true, data: brands });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
