import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import ProfileOtp from "@/models/ProfileOtp";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email wajib diisi" },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase();
    
    // Check if user exists - return generic message to prevent email enumeration
    const user = await User.findOne({ email: lowerEmail });
    if (!user) {
      return NextResponse.json(
        { success: true, message: "Jika email terdaftar, instruksi reset password akan dikirim ke email Anda" },
        { status: 200 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save temporary OTP
    await ProfileOtp.findOneAndUpdate(
      { userId: user._id, type: "reset_password" },
      {
        otp,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Send OTP via email
    await sendOtpEmail(user.email, user.name, otp);

    return NextResponse.json({
      success: true,
      message: "Jika email terdaftar, instruksi reset password akan dikirim ke email Anda",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat memproses permintaan" },
      { status: 500 }
    );
  }
}
