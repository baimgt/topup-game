import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import PaymentConfig from "@/models/PaymentConfig";
import { verifyDuitkuSignature } from "@/lib/duitku";
import { processOrderPayment } from "@/lib/orderProcessor";
import { sendInvoiceEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const textBody = await req.text();
    let data;
    
    // Duitku sends form-urlencoded data
    if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(textBody);
      data = Object.fromEntries(params.entries());
    } else {
      data = JSON.parse(textBody);
    }

    const {
      merchantOrderId,
      amount,
      merchantCode,
      signature,
      reference,
      resultCode
    } = data;

    await connectDB();
    const config = await PaymentConfig.findOne({});
    
    if (!config || !config.duitkuApiKey) {
      console.error("Duitku API Key not configured");
      return NextResponse.json({ success: false, error: "Config not found" }, { status: 500 });
    }

    const isValid = verifyDuitkuSignature(
      merchantCode,
      parseFloat(amount),
      merchantOrderId,
      config.duitkuApiKey,
      signature
    );

    if (!isValid) {
      console.error("Duitku invalid signature");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const order = await Order.findOne({ orderNumber: merchantOrderId });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, message: "Order already paid" });
    }

    if (resultCode === "00") {
      // Payment success
      order.paymentStatus = "PAID";
      order.paidAt = new Date();
      await order.save();

      sendInvoiceEmail(order).catch(e => console.error("Receipt email error:", e));

      // Proses pengiriman item ke Digiflazz
      try {
        await processOrderPayment(order);
      } catch (e) {
        console.error("Gagal proses order otomatis setelah Duitku:", e);
      }
    } else if (resultCode === "01") {
      // Payment failed
      order.paymentStatus = "FAILED";
      order.orderStatus = "FAILED";
      await order.save();
    }

    return NextResponse.json({ success: true, message: "OK" });
  } catch (error) {
    console.error("Duitku webhook error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
