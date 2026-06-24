import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PaymentConfig from "@/models/PaymentConfig";
import { defaultMethods, defaultDuitkuMethods } from "@/lib/payment-methods";

// Public endpoint — tidak perlu auth, dipakai halaman checkout
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const config = await PaymentConfig.findOne({});
    const activeGateway = config?.activePaymentGateway || "midtrans";
    
    const dbMethods = activeGateway === "duitku" ? config?.duitkuMethods : config?.midtransMethods;
    
    let methods;
    if (dbMethods && dbMethods.length > 0) {
      methods = dbMethods;
    } else if (activeGateway === "duitku") {
      methods = defaultDuitkuMethods;
    } else {
      // Legacy fallback for midtrans
      methods = config?.paymentMethods && config.paymentMethods.length > 0 ? config.paymentMethods : defaultMethods;
    }

    const active = methods.filter((m: any) => m.enabled);
    return NextResponse.json({ success: true, data: active });
  } catch {
    return NextResponse.json({ success: false, data: defaultMethods.filter(m => m.enabled) });
  }
}
