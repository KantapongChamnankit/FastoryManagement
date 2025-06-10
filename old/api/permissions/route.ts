import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  const { db } = await connectToDatabase()
  const permissions = await db.collection("permissions").find({}).toArray()
  return NextResponse.json(permissions)
}

export async function POST(request: NextRequest) {
  const { db } = await connectToDatabase()
  const body = await request.json()
  // Upsert permissions for a role
  await db.collection("permissions").updateOne(
    { role: body.role },
    { $set: { permissions: body.permissions } },
    { upsert: true }
  )
  return NextResponse.json({ success: true })
}