import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import PaymentConfig from "@/models/PaymentConfig";
import { verifyMidtransSignature } from "@/lib/midtrans";
import { createTransaction, generateRefId } from "@/lib/digiflazz";
import { MidtransNotification, PaymentStatus } from "@/types";
import { sendInvoiceEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const notification: MidtransNotification = await req.json();

    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } =
      notification;

    const paymentConfig = await PaymentConfig.findOne();
    if (!paymentConfig) {
      return NextResponse.json({ success: false, error: "Payment config not found" }, { status: 500 });
    }

    const isValid = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      paymentConfig.midtransServerKey,
      signature_key
    );

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const order = await Order.findOne({ orderNumber: order_id });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // ── SECURITY: Verify amount integrity to prevent manipulation ──────────
    // Gross amount from Midtrans must match the order total in our database
    const notifAmount = parseFloat(gross_amount);
    if (Math.abs(notifAmount - order.totalAmount) > 1) {
      console.error(`[SECURITY] Amount mismatch for ${order_id}: notif=${notifAmount}, db=${order.totalAmount}`);
      return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
    }

    // ── Idempotency guard: skip if already processed ───────────────────────
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    const oldStatus = order.paymentStatus;
    
    // Determine new payment status
    let newStatus: PaymentStatus = order.paymentStatus;
    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "accept" || !fraud_status) newStatus = "PAID";
    } else if (["deny", "cancel"].includes(transaction_status)) {
      newStatus = "FAILED";
    } else if (transaction_status === "expire") {
      newStatus = "EXPIRED";
    }

    order.paymentStatus = newStatus as any;
    if (newStatus === "PAID" && oldStatus !== "PAID") order.paidAt = new Date();
    order.paymentMethod = notification.payment_type;
    await order.save();

    // Process Digiflazz if just paid
    if (newStatus === "PAID" && oldStatus !== "PAID") {
      sendInvoiceEmail(order).catch(e => console.error("Receipt email error:", e));
      const { processOrderPayment } = await import("@/lib/orderProcessor");
      await processOrderPayment(order);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
