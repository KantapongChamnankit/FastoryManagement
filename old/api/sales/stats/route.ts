import { NextResponse } from "next/server"
import { SaleService } from "@/lib/services/sale-service"

export async function GET() {
  try {
    const stats = await SaleService.getSalesStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching sales stats:", error)
    return NextResponse.json({ error: "Failed to fetch sales stats" }, { status: 500 })
  }
}
