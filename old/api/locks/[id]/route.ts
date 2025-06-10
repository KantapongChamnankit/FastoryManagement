import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const result = await db.collection("locks").deleteOne({ _id: new ObjectId(params.id) })
    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Lock deleted" }, { status: 200 })
    } else {
      return NextResponse.json({ error: "Lock not found" }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete lock" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()
    const update = {
      name: body.name,
      capacity: Number(body.capacity),
      location: body.location,
    }
    const result = await db.collection("locks").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    )
    if (result.matchedCount === 1) {
      return NextResponse.json({ message: "Lock updated" }, { status: 200 })
    } else {
      return NextResponse.json({ error: "Lock not found" }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lock" }, { status: 500 })
  }
}