import { NextRequest, NextResponse } from "next/server";
import { DBConnect } from "@/lib/utils/DBConnect";
import { Image } from "@/lib/models/image";
import { autoSerialize } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await DBConnect();
  const image = autoSerialize(await Image.findById(params.id).lean());

  if (!image || !image.url) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const match = image.url.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
  }

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=31536000",
    },
  });
}