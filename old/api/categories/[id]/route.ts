import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()
    const update = {
      name: body.name,
      description: body.description,
    }
    const result = await db.collection("categories").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    )
    if (result.matchedCount === 1) {
      return NextResponse.json({ message: "Category updated" }, { status: 200 })
    } else {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const result = await db.collection("categories").deleteOne({ _id: new ObjectId(params.id) })
    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Category deleted" }, { status: 200 })
    } else {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}