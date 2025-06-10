import { NextRequest, NextResponse } from "next/server"
import { ProductService } from "@/lib/services/product-service"
import { SaleService } from "@/lib/services/sale-service"
import { connectToDatabase } from "@/lib/mongodb" // Add this import

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const quantity = Number(body.quantity) || 1

    const product = await ProductService.getProductById(params.id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (product.quantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 })
    }
    const totalAmount = product.unitPrice * quantity
    const profit = (product.unitPrice - product.lotCost) * quantity

    await SaleService.createSale({
      productId: product._id!,
      productName: product.name,
      quantity,
      unitPrice: product.unitPrice,
      totalAmount,
      profit,
      customer: "Unknown"
    })

    await ProductService.updateStock(params.id, quantity)

    // Log activity
    const { db } = await connectToDatabase()
    await db.collection("activities").insertOne({
      type: "sale",
      action: `Sold ${quantity} unit(s)`,
      item: product.name,
      time: new Date().toISOString(),
    })

    return NextResponse.json({ message: "Product sold" }, { status: 200 })
  } catch (error) {
    console.error("Error selling product:", error)
    return NextResponse.json({ error: "Failed to sell product" }, { status: 500 })
  }
}