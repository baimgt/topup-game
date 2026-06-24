import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import OtpVerification from "@/models/OtpVerification";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email dan kode OTP wajib diisi" },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase();
    const verification = await OtpVerification.findOne({ email: lowerEmail });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Registrasi tidak ditemukan. Silakan kirim ulang OTP" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > verification.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Kode OTP telah kedaluwarsa. Silakan kirim ulang" },
        { status: 400 }
      );
    }

    // Check OTP match
    if (verification.otp !== otp.trim()) {
      return NextResponse.json(
        { success: false, error: "Kode OTP salah" },
        { status: 400 }
      );
    }

    // Create permanent user account
    const user = await User.create({
      name: verification.name,
      email: verification.email,
      phone: verification.phone,
      password: verification.password, // already hashed in send-otp
      role: "USER",
    });

    // Delete temporary verification record
    await OtpVerification.deleteOne({ _id: verification._id });

    // Issue JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat memverifikasi OTP" },
      { status: 500 }
    );
  }
}
