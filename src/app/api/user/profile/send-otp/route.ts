import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import ProfileOtp from "@/models/ProfileOtp";
import { getUserFromRequest } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = getUserFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type } = body;

    if (type !== "email" && type !== "password") {
      return NextResponse.json(
        { success: false, error: "Tipe OTP tidak valid (harus email atau password)" },
        { status: 400 }
      );
    }

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save temporary OTP
    await ProfileOtp.findOneAndUpdate(
      { userId: auth.userId, type },
      {
        otp,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Send OTP via email to CURRENT email
    await sendOtpEmail(user.email, user.name, otp);

    return NextResponse.json({
      success: true,
      message: "Kode OTP telah dikirim ke email Anda",
    });
  } catch (error) {
    console.error("Profile send OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat mengirim OTP" },
      { status: 500 }
    );
  }
}
