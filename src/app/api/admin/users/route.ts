import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Order from "@/models/Order";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authUser = getUserFromRequest(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role && role !== "ALL") filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter, { password: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    // Attach order count per user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [orderCount, totalSpent] = await Promise.all([
          Order.countDocuments({ userId: u._id }),
          Order.aggregate([
            { $match: { userId: u._id, status: { $in: ["SUCCESS", "PAID"] } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          ]),
        ]);
        return { ...u, orderCount, totalSpent: totalSpent[0]?.total || 0 };
      })
    );

    return NextResponse.json({
      success: true,
      data: { users: usersWithStats, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const authUser = getUserFromRequest(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = await req.json();
    if (!userId || !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Data tidak valid" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(userId, { role }, { new: true, select: "-password" });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
