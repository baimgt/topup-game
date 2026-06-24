import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";
import Order from "@/models/Order";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: auth.userId };
    if (status && status !== "ALL") {
      if (status === "PENDING") {
        filter.$or = [{ paymentStatus: "UNPAID" }, { orderStatus: "PENDING" }];
      } else if (status === "FAILED") {
        filter.$or = [{ paymentStatus: "FAILED" }, { paymentStatus: "EXPIRED" }, { orderStatus: "FAILED" }];
      } else {
        filter.orderStatus = status;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    // Stats
    // Assuming user's totalSpent is based on SUCCESSful orders
    const userObjectId = new mongoose.Types.ObjectId(auth.userId);
    const [totalSpent, successCount] = await Promise.all([
      Order.aggregate([
        { $match: { userId: userObjectId, orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments({ userId: auth.userId, orderStatus: "SUCCESS" }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stats: { totalSpent: totalSpent[0]?.total || 0, successCount, totalOrders: total },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
