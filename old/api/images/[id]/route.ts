import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { db } = await connectToDatabase()
  const image = await db.collection("images").findOne({ _id: new ObjectId(id) })

  if (!image) {
    return new Response("Not found", { status: 404 })
  }

  // Extract content type and base64 data
  const matches = image.base64.match(/^data:(.+);base64,(.+)$/)
  if (!matches) {
    return new Response("Invalid image data", { status: 500 })
  }
  const contentType = matches[1]
  const buffer = Buffer.from(matches[2], "base64")

  return new Response(buffer, {
    headers: { "Content-Type": contentType },
  })
}