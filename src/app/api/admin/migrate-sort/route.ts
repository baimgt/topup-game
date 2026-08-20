import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Game from "@/models/Game";
import { getUserFromRequest } from "@/lib/auth";

// One-time migration: populate homeSortOrder from sortOrder for all games that don't have it set
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Update all games where homeSortOrder is not set (null/undefined/0) to use sortOrder value
    const result = await Game.updateMany(
      { $or: [{ homeSortOrder: { $exists: false } }, { homeSortOrder: null }, { homeSortOrder: 0 }] },
      [{ $set: { homeSortOrder: { $ifNull: ["$sortOrder", 0] } } }]
    );

    return NextResponse.json({
      success: true,
      message: `Migrasi selesai: ${result.modifiedCount} game diperbarui`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ success: false, error: "Gagal migrasi" }, { status: 500 });
  }
}
