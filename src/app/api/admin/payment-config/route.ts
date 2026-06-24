import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import PaymentConfig from "@/models/PaymentConfig";
import { getUserFromRequest } from "@/lib/auth";

// Mask sensitive key — tampilkan hanya 6 char pertama + ****
function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? "****" : "";
  return key.slice(0, 6) + "****" + key.slice(-4);
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const config = await PaymentConfig.findOne({}).lean();

    if (!config) {
      return NextResponse.json({ success: true, data: null });
    }

    // Return masked version for display
    return NextResponse.json({
      success: true,
      data: {
        ...config,
        midtransServerKey: maskKey(config.midtransServerKey),
        midtransClientKey: maskKey(config.midtransClientKey),
        duitkuApiKey: maskKey(config.duitkuApiKey),
        digiflazzApiKey: maskKey(config.digiflazzApiKey),
        // username, merchant code, & webhook secret tidak perlu di-mask
      },
    });
  } catch (error) {
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

    const body = await req.json();

    // Only update fields that are not masked (not containing ****)
    const existing = await PaymentConfig.findOne({});
    const updateData: Record<string, unknown> = { updatedBy: user.email };

    const fields = [
      "activePaymentGateway",
      "midtransServerKey", "midtransClientKey", "midtransIsProduction", "midtransEnabled",
      "duitkuMerchantCode", "duitkuApiKey", "duitkuIsProduction", "duitkuEnabled",
      "digiflazzUsername", "digiflazzApiKey", "digiflazzWebhookSecret", "digiflazzEnabled",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        const val = body[field];
        // Skip masked values
        if (typeof val === "string" && val.includes("****")) {
          continue;
        }
        updateData[field] = val;
      }
    }

    const config = await PaymentConfig.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: { id: config._id, updatedAt: config.updatedAt } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
