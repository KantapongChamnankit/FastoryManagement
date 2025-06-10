import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  const { db } = await connectToDatabase()
  const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray()
  return NextResponse.json(
    users.map(user => ({
      ...user,
      id: user._id?.toString(),
      _id: undefined,
    }))
  )
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()
    const now = new Date().toISOString()
    const newUser = {
      name: body.name,
      email: body.email,
      role: body.role || "staff",
      status: body.status || "Active",
      password: body.password, // In production, hash the password!
      createdAt: now,
      lastLogin: "",
    }
    const result = await db.collection("users").insertOne(newUser)
    return NextResponse.json({ ...newUser, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}