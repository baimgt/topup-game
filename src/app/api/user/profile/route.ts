import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getUserFromRequest, hashPassword, comparePassword } from "@/lib/auth";
import ProfileOtp from "@/models/ProfileOtp";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await User.findById(auth.userId, { password: 0 }).lean();
    if (!user) return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  email: z.string().email("Email tidak valid").optional(),
  phone: z.string().min(9, "Nomor telepon minimal 9 karakter").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password minimal 6 karakter").optional(),
  otp: z.string().length(6, "OTP harus 6 digit").optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, phone, currentPassword, newPassword, otp } = parsed.data;
    const updateData: Record<string, string> = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // Check email uniqueness and OTP
    if (email && email !== auth.email) {
      if (!otp) return NextResponse.json({ success: false, error: "OTP wajib diisi untuk mengubah email" }, { status: 400 });
      
      const otpRecord = await ProfileOtp.findOne({ userId: auth.userId, type: "email", otp });
      if (!otpRecord) return NextResponse.json({ success: false, error: "OTP salah atau sudah kedaluwarsa" }, { status: 400 });

      const existing = await User.findOne({ email, _id: { $ne: auth.userId } });
      if (existing) return NextResponse.json({ success: false, error: "Email sudah digunakan" }, { status: 400 });
      updateData.email = email;
      
      // Delete OTP record after successful validation
      await ProfileOtp.deleteOne({ _id: otpRecord._id });
    }

    // Change password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: "Masukkan password saat ini" }, { status: 400 });
      }
      if (!otp) return NextResponse.json({ success: false, error: "OTP wajib diisi untuk mengubah password" }, { status: 400 });

      const otpRecord = await ProfileOtp.findOne({ userId: auth.userId, type: "password", otp });
      if (!otpRecord) return NextResponse.json({ success: false, error: "OTP salah atau sudah kedaluwarsa" }, { status: 400 });

      const user = await User.findById(auth.userId);
      const valid = await comparePassword(currentPassword, user!.password);
      if (!valid) return NextResponse.json({ success: false, error: "Password saat ini salah" }, { status: 400 });
      updateData.password = await hashPassword(newPassword);

      // Delete OTP record after successful validation
      await ProfileOtp.deleteOne({ _id: otpRecord._id });
    }

    const updated = await User.findByIdAndUpdate(
      auth.userId,
      { $set: updateData },
      { new: true, select: "-password" }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
