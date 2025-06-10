import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { ProductService } from "@/lib/services/product-service"

export async function GET() {
  const { db } = await connectToDatabase()
  const categories = await db.collection("categories").find({}).toArray()

  // Get product counts for each category
  const products = await ProductService.getAllProducts()
  const categoryCountMap: Record<string, number> = {}
  products.forEach(product => {
    if (product.category) {
      categoryCountMap[product.category] = (categoryCountMap[product.category] || 0) + 1
    }
  })

  return NextResponse.json(
    categories.map(cat => ({
      ...cat,
      id: cat._id.toString(),
      _id: undefined,
      productCount: categoryCountMap[cat.name] || 0,
    }))
  )
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()
    const newCategory = {
      name: body.name,
      description: body.description,
      productCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    const result = await db.collection("categories").insertOne(newCategory)
    return NextResponse.json({ ...newCategory, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
