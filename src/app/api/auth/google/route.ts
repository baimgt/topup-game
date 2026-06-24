import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Credential token tidak ditemukan" },
        { status: 400 }
      );
    }

    // Verify token with Google's tokeninfo API
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { success: false, error: "Token Google tidak valid atau kadaluarsa" },
        { status: 400 }
      );
    }

    const payload = await googleRes.json();
    const { email, name, email_verified } = payload;

    if (!email_verified || email_verified === "false") {
      return NextResponse.json(
        { success: false, error: "Email Google belum diverifikasi" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          email: email.toLowerCase(),
          name: name || email.split("@")[0],
        },
      });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        exists: true,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat autentikasi Google" },
      { status: 500 }
    );
  }
}
