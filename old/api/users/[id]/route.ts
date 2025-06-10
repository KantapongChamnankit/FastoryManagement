import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()
    const updates: any = {
      name: body.name,
      email: body.email,
      role: body.role,
      status: body.status,
      updatedAt: new Date().toISOString(),
    }
    if (body.password) updates.password = body.password // In production, hash the password!
    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: updates },
      { returnDocument: "after" }
    )
    if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ ...result, id: result._id.toString(), _id: undefined })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(params.id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}