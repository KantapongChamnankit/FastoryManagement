import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

// Replace the deprecated config export with the new route segment config
export const bodyParser = false

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { base64, filename } = body

  if (!base64 || !filename) {
    return NextResponse.json({ error: "No base64 data or filename provided" }, { status: 400 })
  }

  // Save base64 string and filename to MongoDB
  const { db } = await connectToDatabase()
  const result = await db.collection("images").insertOne({
    filename,
    base64,
    createdAt: new Date(),
  })

  // Return the MongoDB document ID as the image ID
  return NextResponse.json({ id: result.insertedId.toString() })
}
