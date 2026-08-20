import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action, productIds, category, isActive } = await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, error: "Pilih minimal 1 produk" }, { status: 400 });
    }

    if (action === "updateCategory") {
      if (!category || typeof category !== "string" || !category.trim()) {
        return NextResponse.json({ success: false, error: "Kategori wajib diisi" }, { status: 400 });
      }

      const result = await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { category: category.trim() } }
      );

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} produk berhasil diubah kategorinya menjadi "${category.trim()}"`,
      });
    }

    if (action === "toggleActive") {
      const activeState = Boolean(isActive);
      const result = await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { isActive: activeState } }
      );

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} produk berhasil ${activeState ? "diaktifkan" : "dinonaktifkan"}`,
      });
    }

    if (action === "delete") {
      const result = await Product.deleteMany({ _id: { $in: productIds } });

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} produk berhasil dihapus`,
      });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("Bulk action product error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
