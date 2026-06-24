import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const user = await User.findById(id, { password: 0 }).lean();
    if (!user) return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const { name, email, role, password } = await req.json();

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role && ["USER", "ADMIN"].includes(role)) updateData.role = role;
    if (password && password.length >= 6) {
      updateData.password = await hashPassword(password);
    }

    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true, select: "-password" });
    if (!user) return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    // Prevent deleting yourself
    if (auth.userId === id) {
      return NextResponse.json({ success: false, error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
    }
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
