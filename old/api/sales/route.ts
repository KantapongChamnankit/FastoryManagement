import { type NextRequest, NextResponse } from "next/server"
import { SaleService } from "@/lib/services/sale-service"
import { ProductService } from "@/lib/services/product-service"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recent = searchParams.get("recent")

    let sales
    if (recent) {
      sales = await SaleService.getRecentSales(Number.parseInt(recent))
    } else {
      sales = await SaleService.getAllSales()
    }

    return NextResponse.json(sales)
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity, customer } = body

    // Get product details
    const product = await ProductService.getProductById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (product.quantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 })
    }

    // Calculate sale details
    const totalAmount = product.unitPrice * quantity
    const profit = (product.unitPrice - product.lotCost) * quantity

    // Create sale record
    const sale = await SaleService.createSale({
      productId: product._id!,
      productName: product.name,
      quantity,
      unitPrice: product.unitPrice,
      totalAmount,
      profit,
      customer,
    })

    // Update product stock
    await ProductService.updateStock(productId, quantity)

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error("Error creating sale:", error)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }
}
