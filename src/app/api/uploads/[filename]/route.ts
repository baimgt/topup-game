import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest, props: { params: Promise<{ filename: string }> }) {
  const params = await props.params;
  const filename = params.filename;
  
  try {
    const uploadDir = path.resolve(process.cwd(), "public", "uploads");
    const safeFilename = path.basename(filename);
    const filePath = path.resolve(uploadDir, safeFilename);

    // Pastikan tidak ada directory traversal attack (path traversal)
    if (!filePath.startsWith(uploadDir) || safeFilename !== filename) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    let contentType = "application/octet-stream";
    const lower = safeFilename.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lower.endsWith(".png")) contentType = "image/png";
    else if (lower.endsWith(".svg")) contentType = "image/svg+xml";
    else if (lower.endsWith(".webp")) contentType = "image/webp";
    else if (lower.endsWith(".gif")) contentType = "image/gif";
    else if (lower.endsWith(".ico")) contentType = "image/x-icon";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
