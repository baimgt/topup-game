import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PaymentConfig from "@/models/PaymentConfig";
import { getUserFromRequest } from "@/lib/auth";
import { defaultMethods, defaultDuitkuMethods } from "@/lib/payment-methods";

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gateway = searchParams.get("gateway") || "midtrans";

    await connectDB();
    const config = await PaymentConfig.findOne({});
    
    const dbMethods = gateway === "duitku" ? (config as any)?.duitkuMethods : (config as any)?.midtransMethods;
    
    let methods;
    if (dbMethods && dbMethods.length > 0) {
      methods = dbMethods;
    } else if (gateway === "duitku") {
      methods = defaultDuitkuMethods;
    } else {
      // Legacy fallback for midtrans
      methods = (config as any)?.paymentMethods && (config as any).paymentMethods.length > 0 ? (config as any).paymentMethods : defaultMethods;
    }
    
    return NextResponse.json({
      success: true,
      data: methods,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { gateway, methods } = await req.json();
    const key = gateway === "duitku" ? "duitkuMethods" : "midtransMethods";

    await PaymentConfig.findOneAndUpdate(
      {},
      { $set: { [key]: methods } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
