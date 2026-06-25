import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getUserFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

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

    // 3. Convert File to ArrayBuffer and Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Create safe unique file name
    const ext = path.extname(file.name);
    const safeName = file.name
      .replace(ext, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${safeName}-${uniqueSuffix}${ext}`;

    // 5. Define upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Ensure the directory exists
    await mkdir(uploadDir, { recursive: true });

    // Write file to filesystem
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // 6. Return relative URL path pointing to the new dynamic API route
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
