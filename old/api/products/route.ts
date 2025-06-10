import { type NextRequest, NextResponse } from "next/server"
import { ProductService } from "@/lib/services/product-service"
import { connectToDatabase } from "@/lib/mongodb"

function validateProductData(data: any) {
  const errors: string[] = []
  if (!data.name || typeof data.name !== "string") errors.push("Name is required.")
  if (!data.barcode || typeof data.barcode !== "string") errors.push("Barcode is required.")
  if (!data.category || typeof data.category !== "string") errors.push("Category is required.")
  if (!data.lock || typeof data.lock !== "string") errors.push("Lock is required.")
  if (data.quantity == null || isNaN(Number(data.quantity)) || Number(data.quantity) < 0) errors.push("Quantity must be a non-negative number.")
  if (data.unitPrice == null || isNaN(Number(data.unitPrice)) || Number(data.unitPrice) < 0) errors.push("Unit price must be a non-negative number.")
  if (data.lotCost == null || isNaN(Number(data.lotCost)) || Number(data.lotCost) < 0) errors.push("Lot cost must be a non-negative number.")
  return errors
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let products
    if (search) {
      products = await ProductService.searchProducts(search)
    } else {
      products = await ProductService.getAllProducts()
    }

    // Add auto status to each product
    const productsWithStatus = products.map((product: any) => {
      let status = "In Stock"
      if (product.quantity === 0) status = "Out of Stock"
      else if (product.quantity <= 10) status = "Low Stock"
      return { ...product, status }
    })

    return NextResponse.json(productsWithStatus)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const errors = validateProductData(body)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 })
    }
    const product = await ProductService.createProduct(body)

    // Log activity
    const { db } = await connectToDatabase()
    await db.collection("activities").insertOne({
      type: "add",
      action: "Added product",
      item: product.name,
      time: new Date().toISOString(),
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const errors = validateProductData(body)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 })
    }
    const product = await ProductService.updateProduct(body._id, body)

    // Log activity
    const { db } = await connectToDatabase()
    await db.collection("activities").insertOne({
      type: "update",
      action: "Updated product",
      item: product?.name,
      time: new Date().toISOString(),
    })

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}
