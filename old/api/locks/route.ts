import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ProductService } from "@/lib/services/product-service"

export async function GET() {
  const { db } = await connectToDatabase()
  const locks = await db.collection("locks").find({}).toArray()

  const products = await ProductService.getAllProducts()
  const lockStockMap: Record<string, number> = {}
  products.forEach(product => {
    if (product.lock) {
      lockStockMap[product.lock] = (lockStockMap[product.lock] || 0) + Number(product.quantity || 0)
    }
  })

  return NextResponse.json(
    locks.map(lock => {
      const currentStock = lockStockMap[lock.name] || 0
      let status = "Active"
      if (currentStock >= lock.capacity) status = "Full"
      else if (currentStock === 0) status = "Empty"
      return {
        ...lock,
        id: lock._id.toString(),
        _id: undefined,
        currentStock,
        status,
      }
    })
  )
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const body = await request.json()
    const newLock = {
      name: body.name,
      capacity: Number(body.capacity),
      currentStock: 0,
      location: body.location,
      status: "Active",
      createdAt: new Date().toISOString().slice(0, 10),
    }
    const result = await db.collection("locks").insertOne(newLock)
    return NextResponse.json({ ...newLock, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create lock" }, { status: 500 })
  }
}