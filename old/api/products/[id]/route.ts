import { NextRequest, NextResponse } from "next/server"
import { ProductService } from "@/lib/services/product-service"
import { connectToDatabase } from "@/lib/mongodb" // Add this import

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await ProductService.getProductById(params.id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    // Remove _id and id if present
    if ('_id' in updates) delete updates._id
    if ('id' in updates) delete updates.id

    const updated = await ProductService.updateProduct(params.id, updates)
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get product info before deleting for activity log
    const product = await ProductService.getProductById(params.id)
    const deleted = await ProductService.deleteProduct(params.id)
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Log activity
    const { db } = await connectToDatabase()
    await db.collection("activities").insertOne({
      type: "delete",
      action: "Deleted product",
      item: product?.name || params.id,
      time: new Date().toISOString(),
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
