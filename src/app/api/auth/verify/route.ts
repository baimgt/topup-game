import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Token tidak valid" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(payload.userId).select("-password").lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
