import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { getUserFromRequest } from "@/lib/auth";

// ── SECURITY: Escape karakter regex untuk mencegah ReDoS ─────────────────
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20")), 100);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      if (status === "PENDING") {
        filter.$or = [{ paymentStatus: "UNPAID" }, { orderStatus: "PENDING" }];
      } else if (status === "FAILED") {
        filter.$or = [{ paymentStatus: "FAILED" }, { paymentStatus: "EXPIRED" }, { orderStatus: "FAILED" }];
      } else {
        filter.orderStatus = status;
      }
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { orderNumber: { $regex: safeSearch, $options: "i" } },
        { customerName: { $regex: safeSearch, $options: "i" } },
        { customerEmail: { $regex: safeSearch, $options: "i" } },
        { gameName: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

