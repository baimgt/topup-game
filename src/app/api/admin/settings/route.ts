import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const settings = await Setting.findOne({});
    return NextResponse.json({ success: true, data: settings || {} });
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

    // Whitelist field yang boleh diupdate — mencegah mass assignment
    const ALLOWED_FIELDS = [
      "maintenanceMode", "maintenanceMessage",
      "announcementEnabled", "announcementText", "announcementImage", "announcementUrl",
      "siteName", "siteLogo", "siteDescription",
      "companyAddress", "contactEmail", "contactPhone",
      "whatsappNumber", "instagramUrl",
      "smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom",
    ];
    const safeBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key))
    );

    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: safeBody },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
