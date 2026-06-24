import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    await connectDB();
    const { orderNumber } = await params;

    let order = await Order.findOne({ orderNumber })
      .populate("orderItems.productId")
      .lean();

    if (order && (order.paymentStatus === "UNPAID" || order.orderStatus === "PROCESSING")) {
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

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}
