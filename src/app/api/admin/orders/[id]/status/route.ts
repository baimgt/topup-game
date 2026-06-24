import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { getUserFromRequest } from "@/lib/auth";
import { sendInvoiceEmail } from "@/lib/mail";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { paymentStatus, orderStatus } = body;

    await connectDB();
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const oldPaymentStatus = order.paymentStatus;

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (orderStatus) order.orderStatus = orderStatus;

    if (paymentStatus === "PAID" && !order.paidAt) {
      order.paidAt = new Date();
    }

    if (paymentStatus === "PAID" && oldPaymentStatus !== "PAID") {
      const { decrementFlashSaleStock } = await import("@/lib/orderProcessor");
      await decrementFlashSaleStock(order);
    }
    await order.save();

    if (paymentStatus === "PAID" && oldPaymentStatus !== "PAID") {
      sendInvoiceEmail(order).catch(e => console.error("Receipt email error:", e));
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Update status error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
