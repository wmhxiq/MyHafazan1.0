import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  const hash =
    "$2b$10$x05Br5DMJYisuktdyvWNf./6XWHlv8TIsWwcug8Leg.r3VpPf9saW";

  const match = await bcrypt.compare(
    "123",
    hash
  );

  return NextResponse.json({
    match,
  });
}