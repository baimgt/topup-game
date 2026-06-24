import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import ProfileOtp from "@/models/ProfileOtp";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase();
    
    // Find user
    const user = await User.findOne({ email: lowerEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "OTP salah atau sudah kedaluwarsa" },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpRecord = await ProfileOtp.findOne({ 
      userId: user._id, 
      type: "reset_password", 
      otp 
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "OTP salah atau sudah kedaluwarsa" },
        { status: 400 }
      );
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    // Delete used OTP
    await ProfileOtp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat mereset password" },
      { status: 500 }
    );
  }
}
