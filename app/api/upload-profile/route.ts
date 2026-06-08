import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();

    const file = data.get("file") as File;
    const fileName = data.get("fileName") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Tiada fail dihantar" },
        { status: 400 },
      );
    }

    // Validate JPG
    if (
      file.type !== "image/jpeg" &&
      !file.name.toLowerCase().endsWith(".jpg")
    ) {
      return NextResponse.json(
        { error: "Hanya fail JPG dibenarkan" },
        { status: 400 },
      );
    }

    // Validate size < 50KB
    if (file.size > 50 * 1024) {
      return NextResponse.json(
        { error: "Saiz fail mesti kurang 50KB" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save path
    const uploadDir = path.join(process.cwd(), "public", "img");

    // Create folder if not exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      path: `/img/${fileName}`,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ralat semasa upload fail" },
      { status: 500 },
    );
  }
}