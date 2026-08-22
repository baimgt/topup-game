import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getUserFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize user as ADMIN
    const user = getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada berkas yang diunggah" },
        { status: 400 }
      );
    }

    // 3. Validasi tipe file — hanya gambar yang diizinkan
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_MIME.includes(file.type) || !ALLOWED_EXT.includes(ext)) {
      return NextResponse.json(
        { success: false, error: "Hanya file gambar yang diizinkan (JPG, PNG, WEBP, GIF, SVG)" },
        { status: 400 }
      );
    }

    // 4. Batasi ukuran file max 5MB
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    // 5. Convert File to ArrayBuffer and Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 6. Create safe unique file name
    const safeName = file.name
      .replace(ext, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${safeName}-${uniqueSuffix}${ext}`;

    // 7. Define upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // 8. Write file to filesystem
    const filePath = path.join(uploadDir, filename);

    // Double-check path traversal (defensive)
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ success: false, error: "Invalid file path" }, { status: 400 });
    }

    await writeFile(filePath, buffer);

    // 9. Return relative URL path pointing to the new dynamic API route
    const fileUrl = `/api/uploads/${filename}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("POST upload error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengunggah berkas" },
      { status: 500 }
    );
  }
}
