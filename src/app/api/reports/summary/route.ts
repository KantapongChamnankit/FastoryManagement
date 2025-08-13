import { NextResponse } from 'next/server'
import * as ProductService from '@/lib/services/ProductService'
import * as CategoryService from '@/lib/services/CategoryService'
import * as StockLocationService from '@/lib/services/StockLocationService'
import * as SettingService from '@/lib/services/SettingService'
import * as TransactionService from '@/lib/services/TransactionService'

// Helper: basic in-memory cache (per server instance)
let cache: { data: any; ts: number } | null = null
const TTL_MS = 60_000 // 60s

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url)
  const dateRange = searchParams.get('dateRange') || 'last-6-months'
    const now = Date.now()
    if (cache && now - cache.ts < TTL_MS) {
      return NextResponse.json(cache.data, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } })
    }

    // Fetch in parallel
    const [products, categories, stockLocations, settings] = await Promise.all([
      ProductService.list({}),
      CategoryService.list(),
      StockLocationService.list(),
      SettingService.getSettings()
    ])

    // Fetch transactions and filter by dateRange
    const allTx = await TransactionService.list()
    const since = (() => {
      const d = new Date()
      switch (dateRange) {
        case 'last-7-days':
          return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        case 'last-30-days':
          return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        case 'last-3-months':
          return new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000)
        case 'last-6-months':
          return new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
        case 'last-year':
          return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        default:
          return new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
      }
    })()
    const salesTrend = Array.isArray(allTx)
      ? allTx.filter((t: any) => new Date(Number(t?.created_at)) >= since)
      : []

  const data = { products, categories, stockLocations, settings, salesTrend }
    cache = { data, ts: now }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } })
  } catch (err: any) {
    console.error('summary api error', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
