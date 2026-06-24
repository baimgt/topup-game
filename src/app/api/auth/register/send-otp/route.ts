import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import OtpVerification from "@/models/OtpVerification";
import { hashPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mail";
import { z } from "zod";

const sendOtpSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(9, "Nomor telepon minimal 9 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await hashPassword(password);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save temporary details with OTP
    await OtpVerification.findOneAndUpdate(
      { email: lowerEmail },
      {
        name,
        phone,
        password: hashedPassword,
        otp,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Send OTP via email
    await sendOtpEmail(lowerEmail, name, otp);

    return NextResponse.json({
      success: true,
      message: "Kode OTP telah dikirim ke email Anda",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat mengirim OTP" },
      { status: 500 }
    );
  }
}
