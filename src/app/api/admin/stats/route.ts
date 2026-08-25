import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Game from "@/models/Game";
import Product from "@/models/Product";
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
      // Profit aggregations
      profitData,
      monthlyProfitData,
      lastMonthProfitData,
      // Catalog all active products for margin analysis
      allProducts,
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
      // Last 6 months revenue & profit
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
            profit: { $sum: "$profit" },
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
      // Total Profit aggregated
      Order.aggregate([
        { $match: { orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$profit" } } },
      ]),
      // Monthly Profit aggregated
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$profit" } } },
      ]),
      // Last Month Profit aggregated
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, orderStatus: "SUCCESS" } },
        { $group: { _id: null, total: { $sum: "$profit" } } },
      ]),
      // Active Products for Catalog Margin Analysis
      Product.find({ isActive: true })
        .select("name price sellingPrice category gameId")
        .populate("gameId", "name image")
        .lean(),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    const thisMonthRevenue = monthlyOrders[0]?.total || 0;
    const lastMonthRevenue = lastMonthOrders[0]?.total || 0;
    const totalProfit = profitData[0]?.total || 0;
    const thisMonthProfit = monthlyProfitData[0]?.total || 0;
    const lastMonthProfit = lastMonthProfitData[0]?.total || 0;

    const revenueGrowth = lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : "0";

    const profitGrowth = lastMonthProfit > 0
      ? (((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100).toFixed(1)
      : "0";

    // Format monthly chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const chartData = monthlyChart.map((d: any) => ({
      month: monthNames[d._id.month - 1],
      revenue: d.revenue || 0,
      profit: d.profit || 0,
      orders: d.count || 0,
    }));

    // Catalog Margin Calculations
    let totalCatalogMargin = 0;
    let totalCatalogCost = 0;
    let totalCatalogSelling = 0;

    const productMarginList = (allProducts || []).map((p: any) => {
      const cost = Number(p.price) || 0;
      const selling = Number(p.sellingPrice) || 0;
      const marginRp = Math.max(0, selling - cost);
      const marginPercent = cost > 0 ? ((marginRp / cost) * 100) : 0;
      totalCatalogMargin += marginRp;
      totalCatalogCost += cost;
      totalCatalogSelling += selling;

      return {
        _id: p._id,
        name: p.name,
        gameName: p.gameId?.name || "Game",
        gameImage: p.gameId?.image || "",
        costPrice: cost,
        sellingPrice: selling,
        marginRp,
        marginPercent: parseFloat(marginPercent.toFixed(1)),
      };
    });

    const totalProductsCount = allProducts?.length || 0;
    const avgMarginRp = totalProductsCount > 0 ? Math.round(totalCatalogMargin / totalProductsCount) : 0;
    const avgMarginPercent = totalCatalogCost > 0 ? ((totalCatalogMargin / totalCatalogCost) * 100).toFixed(1) : "0";

    // Top 6 products with highest margin amount
    const topMarginProducts = [...productMarginList]
      .sort((a, b) => b.marginRp - a.marginRp)
      .slice(0, 6);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        successOrders,
        pendingOrders,
        failedOrders,
        totalRevenue,
        totalProfit,
        thisMonthProfit,
        lastMonthProfit,
        profitGrowth,
        totalUsers,
        totalGames,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth,
        recentOrders,
        chartData,
        topGames,
        marginStats: {
          totalProducts: totalProductsCount,
          avgMarginRp,
          avgMarginPercent,
          totalCatalogMargin,
          totalCatalogCost,
          totalCatalogSelling,
          topMarginProducts,
        },
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
