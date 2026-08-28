import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    await connectDB();
    const { orderNumber } = await params;

    let order = await Order.findOne({ orderNumber })
      .populate("orderItems.productId")
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (order.paymentStatus === "UNPAID" || order.orderStatus === "PROCESSING") {
      const { syncOrderStatus } = await import("@/lib/orderProcessor");
      const syncedOrder = await syncOrderStatus(orderNumber);
      if (syncedOrder && (syncedOrder.paymentStatus !== order.paymentStatus || syncedOrder.orderStatus !== order.orderStatus)) {
        order = await Order.findOne({ orderNumber })
          .populate("orderItems.productId")
          .lean();
      }
    }

    if (!order) {
      return NextResponse.json({ success: false, error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const PaymentConfig = (await import("@/models/PaymentConfig")).default;
    const paymentConfig = await PaymentConfig.findOne().lean();

    // ── SECURITY: Sembunyikan data sensitif dari user yang bukan pemilik ──
    const authUser = getUserFromRequest(req);
    const isOwner = authUser && order.userId && authUser.userId === order.userId.toString();
    const isAdmin = authUser && authUser.role === "ADMIN";

    // Bersihkan data sensitif bisnis dari response
    const safeOrder: any = { ...order };
    // Hapus field internal bisnis (harga modal, profit) dari semua user kecuali admin
    if (!isAdmin) {
      delete safeOrder.profit;
      if (safeOrder.orderItems) {
        safeOrder.orderItems = safeOrder.orderItems.map((item: any) => {
          const { costPrice, profit, ...rest } = item;
          return rest;
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...safeOrder,
        midtransClientKey: paymentConfig?.midtransClientKey || "",
        midtransIsProduction: paymentConfig?.midtransIsProduction || false,
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}

