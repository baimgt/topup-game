import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";

// Disable caching for this route so leaderboard updates in real-time
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "monthly"; // weekly, monthly, all-time

    const now = new Date();
    let dateFilter = {};

    if (period === "weekly") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      dateFilter = {
        $or: [
          { paidAt: { $gte: oneWeekAgo } },
          { paidAt: { $exists: false }, createdAt: { $gte: oneWeekAgo } },
        ],
      };
    } else if (period === "monthly") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(now.getDate() - 30);
      dateFilter = {
        $or: [
          { paidAt: { $gte: oneMonthAgo } },
          { paidAt: { $exists: false }, createdAt: { $gte: oneMonthAgo } },
        ],
      };
    }

    const matchStage = {
      paymentStatus: "PAID",
      ...dateFilter,
    };

    const leaderboard = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $toLower: "$customerEmail" },
          customerName: { $first: "$customerName" },
          totalSpent: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          games: { $push: "$gameName" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    // Helper to find most frequent item (Favorite Game)
    const getFavoriteGame = (games: string[]) => {
      if (!games || games.length === 0) return "N/A";
      const counts: Record<string, number> = {};
      let maxGame = games[0];
      let maxCount = 0;
      for (const game of games) {
        counts[game] = (counts[game] || 0) + 1;
        if (counts[game] > maxCount) {
          maxGame = game;
          maxCount = counts[game];
        }
      }
      return maxGame;
    };

    // Helper to mask name (e.g., "Jane Doe" -> "Ja** Do**", "alex" -> "Al**")
    const maskName = (name: string) => {
      if (!name) return "Gamer";
      const cleaned = name.trim();
      const parts = cleaned.split(/\s+/);
      return parts
        .map((p) => {
          if (p.length <= 2) return p + "*";
          return p.substring(0, 2) + "*".repeat(Math.max(1, p.length - 2));
        })
        .join(" ");
    };

    const formatted = leaderboard.map((item, index) => ({
      rank: index + 1,
      name: maskName(item.customerName),
      totalSpent: item.totalSpent,
      orderCount: item.orderCount,
      favoriteGame: getFavoriteGame(item.games),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat leaderboard" },
      { status: 500 }
    );
  }
}
