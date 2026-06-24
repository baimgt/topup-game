import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const settings = await Setting.findOne().lean();
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          maintenanceMode: false,
          maintenanceMessage: "",
          announcementEnabled: false,
          announcementText: "",
          announcementImage: "",
          siteName: "GameTopUp",
          siteLogo: "",
          contactEmail: "support@gametopup.com",
          contactPhone: "+62 812-3456-7890",
          whatsappNumber: "6281234567890",
          instagramUrl: "https://instagram.com/gametopup",
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        announcementEnabled: settings.announcementEnabled,
        announcementText: settings.announcementText,
        announcementImage: settings.announcementImage,
        siteName: settings.siteName || "GameTopUp",
        siteLogo: settings.siteLogo || "",
        contactEmail: settings.contactEmail || "support@gametopup.com",
        contactPhone: settings.contactPhone || "+62 812-3456-7890",
        whatsappNumber: settings.whatsappNumber || "6281234567890",
        instagramUrl: settings.instagramUrl || "https://instagram.com/gametopup",
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
