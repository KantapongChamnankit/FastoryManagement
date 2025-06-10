import { NextRequest, NextResponse } from "next/server"
import { DBConnect } from "@/lib/utils/DBConnect"
import { Image } from "@/lib/models/image"

export const bodyParser = false

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { base64, filename } = body

  if (!base64 || !filename) {
    return NextResponse.json({ error: "No base64 data or filename provided" }, { status: 400 })
  }

  await DBConnect()
  const result = await Image.create({
    filename,
    url: base64,
    createdAt: new Date(),
  })

  return NextResponse.json({ id: result._id.toString() })
}
