import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Game from "@/models/Game";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalOrders,
      successOrders,
      pendingOrders,
      failedOrders,
      totalUsers,
      totalGames,
      revenueData,
      monthlyOrders,
      lastMonthOrders,
      recentOrders,
      // Monthly chart data (last 6 months)
      monthlyChart,
      // Top games
      topGames,
      // PPN aggregations
      ppnData,
      monthlyPpnData,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "SUCCESS" }),
      Order.countDocuments({
        $or: [
          { paymentStatus: "UNPAID" },
          { orderStatus: "PENDING" },
          { orderStatus: "PROCESSING" }
        ]
      }),
      Order.countDocuments({
        $or: [
          { paymentStatus: "FAILED" },
          { paymentStatus: "EXPIRED" },
          { orderStatus: "FAILED" }
        ]
      }),
      User.countDocuments(),
      Game.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),
      // Last 6 months revenue
      Order.aggregate([
        {
          $match: {
            orderStatus: "SUCCESS",
            createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
          },
        },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            revenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      // Top games by order count
      Order.aggregate([
        { $match: { orderStatus: "SUCCESS" } },
        { $group: { _id: "$gameName", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      // Total PPN aggregated
      Order.aggregate([
        { $match: { orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$ppn" } } },
      ]),
      // Monthly PPN aggregated
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$ppn" } } },
      ]),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    const thisMonthRevenue = monthlyOrders[0]?.total || 0;
    const lastMonthRevenue = lastMonthOrders[0]?.total || 0;
    const totalPpn = ppnData[0]?.total || 0;
    const thisMonthPpn = monthlyPpnData[0]?.total || 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : "0";

    // Format monthly chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const chartData = monthlyChart.map((d: any) => ({
      month: monthNames[d._id.month - 1],
      revenue: d.revenue,
      orders: d.count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        successOrders,
        pendingOrders,
        failedOrders,
        totalRevenue,
        totalUsers,
        totalGames,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth,
        recentOrders,
        chartData,
        topGames,
        totalPpn,
        thisMonthPpn,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
