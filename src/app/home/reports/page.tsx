"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ComposedChart
} from "recharts"
import { FileText, Download, Calendar, TrendingUp, DollarSign, Package, ShoppingCart, Users, AlertTriangle, Star } from "lucide-react"
import ChartLoader from '@/components/ChartLoader'
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { ICategory, IProduct, ITransaction } from "@/lib"

// Helper to format currency (THB)
const formatCurrency = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) return '฿0'
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(value))
}

// Helper to generate random pastel color
function getRandomColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = hash % 160
  return `hsl(${h}, 70%, 70%)`
}

// Centralized color schemes for distinct chart tones
const chartColors = {
  area: {
    sales: '#0ea5e9',      // cyan-500
    profit: '#6366f1'      // indigo-500
  },
  line: {
    sales: '#f59e0b',      // amber-500
    profit: '#10b981'      // emerald-500
  },
  stackedPalette: [
    '#a7f3d0', '#fbcfe8', '#fde68a', '#c7d2fe', '#fca5a5', '#fcd34d', '#bbf7d0', '#f9a8d4', '#fef3c7', '#dbeafe'
  ],
  piePalette: [
    '#fbcfe8', '#a7f3d0', '#fde68a', '#c7d2fe', '#fca5a5', '#fcd34d', '#bbf7d0', '#f9a8d4', '#fef3c7', '#dbeafe'
  ]
} as const

// Error Boundary Component for Charts
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Chart error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-slate-500 text-center">
            <p>Unable to load chart</p>
            <p className="text-sm">Please try refreshing the page</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("last-6-months")
  const [reportType, setReportType] = useState("sales")
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<IProduct[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [stockLocations, setStockLocations] = useState<any[]>([])
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(null)
  const [data, setData] = useState<{
    salesTrend: ITransaction[],
    categoryData: { name: string, value: number }[],
    keyMetrics: any
  }>({
    salesTrend: [],
    categoryData: [],
    keyMetrics: {
      totalSales: 0,
      totalProfit: 0,
      currentStockValue: 0,
      avgOrderValue: 0,
      salesGrowth: 0,
      profitMargin: 0,
      bestProduct: '',
      totalTransactions: 0,
      lowStockItems: 0
    }
  })
  const { lang } = useLanguage()
  const t = translations[lang]

  useEffect(() => {
    // Fetch aggregated summary in one call
    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/reports/summary?dateRange=${dateRange}`, { signal: controller.signal, cache: 'no-store' })
        if (!res.ok) throw new Error('Failed summary fetch')
        const { products, categories, stockLocations, settings, salesTrend } = await res.json()
        setProducts(products || [])
        setCategories(categories || [])
        setStockLocations(stockLocations || [])
        const threshold = (settings?.lowStockThreshold ?? 10)
        setLowStockThreshold(typeof threshold === 'number' ? threshold : 10)
        // Stage transactions into data for downstream processing
        setData(prev => ({ ...prev, salesTrend }))
      } catch (e) {
        console.error('summary load error', e)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [dateRange])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
  const sale = (data.salesTrend || []).filter((t: ITransaction) => {
          if (dateRange === "last-7-days") {
            return new Date(t.created_at as number) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          } else if (dateRange === "last-30-days") {
            return new Date(t.created_at as number) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          } else if (dateRange === "last-3-months") {
            return new Date(t.created_at as number) >= new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000)
          } else if (dateRange === "last-6-months") {
            return new Date(t.created_at as number) >= new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          } else if (dateRange === "last-year") {
            return new Date(t.created_at as number) >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          } else if (dateRange === "custom") {
            return new Date(t.created_at as number) >= new Date(new Date().setFullYear(new Date().getFullYear() - 1))
          }
        })

        // Only compute categoryData if categories have been loaded
        let categoryData: { name: string; value: number }[] = []
        if (categories.length > 0) {
          categoryData = categories.map((category: ICategory) => {
            const categoryProducts = products.filter((p: IProduct) => p.category_id === category._id)
            const productQuantities = categoryProducts.map((p: IProduct) =>
              sale.reduce((sum: number, t: ITransaction) => {
                const product = t.products.find((prod: any) => prod.product_id === p._id)
                return sum + (product ? product.quantity || 0 : 0)
              }, 0)
            )
            const avgQuantity = productQuantities.length > 0
              ? productQuantities.reduce((a, b) => a + b, 0) / productQuantities.length
              : 0
            const totalAvgQuantity = categories.reduce((acc, cat) => {
              const catProducts = products.filter((p: IProduct) => p.category_id === cat._id)
              const catQuantities = catProducts.map((p: IProduct) =>
                sale.reduce((sum: number, t: ITransaction) => {
                  const product = t.products.find((prod: any) => prod.product_id === p._id)
                  return sum + (product ? product.quantity || 0 : 0)
                }, 0)
              )
              return acc + (catQuantities.length > 0 ? catQuantities.reduce((a, b) => a + b, 0) / catQuantities.length : 0)
            }, 0)
            const percent = totalAvgQuantity > 0 ? (avgQuantity / totalAvgQuantity) * 100 : 0
            return { name: category.name, value: Number(percent.toFixed(2)) }
          })
        }

        const totalSalesAmount = sale.reduce((acc: number, t: ITransaction) => acc + (t.total_price || 0), 0)
        const totalProfitAmount = sale.reduce((acc: number, t: ITransaction) => acc + (t.profit || 0), 0)
        const firstSaleValue = sale[0]?.total_price || 0
        const lastSaleValue = sale[sale.length - 1]?.total_price || 0
        const salesGrowth = (sale.length > 1 && firstSaleValue > 0)
          ? (((lastSaleValue - firstSaleValue) / firstSaleValue) * 100).toFixed(2)
          : 0
        const revenueForMargin = sale.reduce((acc: number, t: ITransaction) => acc + (t.total_price || 0), 0)
        const profitMargin = revenueForMargin > 0
          ? ((totalProfitAmount / revenueForMargin) * 100).toFixed(2)
          : 0

        // Compute low stock products locally using settings threshold (fallback 10)
        const threshold = lowStockThreshold ?? 10
        const lowStockItems = Array.isArray(products)
          ? products.filter((p: IProduct) => typeof p.quantity === 'number' && p.quantity <= threshold).length
          : 0

        const keyMetrics = {
          totalSales: totalSalesAmount,
            totalProfit: totalProfitAmount,
            currentStockValue: products.length ? products.reduce((acc: number, p: IProduct) => acc + (p.price * (p.quantity || 0)), 0) : 0,
            avgOrderValue: sale.length ? (totalSalesAmount / sale.length) : 0,
            salesGrowth,
            profitMargin,
            bestProduct: sale.length
              ? (() => {
                try {
                  const id = sale.reduce(
                    (prev, curr: ITransaction) =>
                      (curr.total_price || 0) > (prev.total_price || 0) ? curr : prev,
                    sale[0]
                  )?.products?.[0]?.product_id
                  const bestProduct = products.find((p: IProduct) => p._id === id)
                  return bestProduct ? bestProduct.name : ""
                } catch {
                  return ""
                }
              })()
              : "",
            totalTransactions: sale.length,
            lowStockItems
        }

        setData({ salesTrend: sale, categoryData, keyMetrics })
      } catch (error) {
        console.error(error)
        setData({ salesTrend: [], categoryData: [], keyMetrics: {} })
      } finally {
        setLoading(false)
      }
    }
    // Only run after products & categories loaded and threshold resolved (or at least attempted)
    if (products) {
      load()
    }
  }, [dateRange, reportType, products, categories, lowStockThreshold])

  // Adaptive aggregation (hourly for short/sparse ranges, daily otherwise)
  const { salesData, timeGranularity } = React.useMemo(() => {
    const empty = { salesData: [] as { name: string; sales: number; profit: number; inventory: number }[], timeGranularity: 'day' as 'hour' | 'day' }
    const trend = data.salesTrend
    if (!Array.isArray(trend) || trend.length === 0) return empty

    // Determine span & decide granularity
    const timestamps = trend.filter(t => t && t.created_at).map(t => Number(t.created_at))
    if (!timestamps.length) return empty
    const minTs = Math.min(...timestamps)
    const maxTs = Math.max(...timestamps)
    const spanMs = maxTs - minTs
    const spanDays = spanMs / (24 * 60 * 60 * 1000)
    const distinctDays = new Set(timestamps.map(ts => new Date(ts).toISOString().slice(0,10))).size

    // Heuristic: use hourly if <=3 days span AND (distinctDays <=2 OR transactions < 400)
    const useHourly = spanDays <= 3 && (distinctDays <= 2 || trend.length < 400)

    if (useHourly) {
      const hourMap: Record<string, { name: string; sales: number; profit: number; inventory: number; ts: number }> = {}
      for (const trx of trend) {
        if (!trx || !trx.created_at) continue
        const d = new Date(Number(trx.created_at))
        if (isNaN(d.getTime())) continue
        // Build hour key in local time
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:00`
        if (!hourMap[key]) {
          hourMap[key] = { name: key, sales: 0, profit: 0, inventory: 0, ts: new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime() }
        }
        hourMap[key].sales += Number(trx.total_price) || 0
        hourMap[key].profit += Number(trx.profit) || 0
      }
      const aggregated = Object.values(hourMap)
        .sort((a,b) => a.ts - b.ts)
        .map(({ ts, ...rest }) => rest)
      return { salesData: aggregated, timeGranularity: 'hour' as const }
    } else {
      const dayMap: Record<string, { name: string; sales: number; profit: number; inventory: number; ts: number }> = {}
      for (const trx of trend) {
        if (!trx || !trx.created_at) continue
        const d = new Date(Number(trx.created_at))
        if (isNaN(d.getTime())) continue
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        if (!dayMap[key]) {
          dayMap[key] = { name: key, sales: 0, profit: 0, inventory: 0, ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
        }
        dayMap[key].sales += Number(trx.total_price) || 0
        dayMap[key].profit += Number(trx.profit) || 0
      }
      const aggregated = Object.values(dayMap)
        .sort((a,b) => a.ts - b.ts)
        .map(({ ts, ...rest }) => rest)
      return { salesData: aggregated, timeGranularity: 'day' as const }
    }
  }, [data.salesTrend])

  const categoryData: { name: string; value: number }[] = Array.isArray(data.categoryData) ? data.categoryData : []
  const keyMetrics: {
    totalSales: number;
    totalProfit: number;
    currentStockValue: number;
    avgOrderValue: number;
    salesGrowth: string | number;
    profitMargin: string | number;
    bestProduct: any;
    totalTransactions: number;
    lowStockItems: number;
  } = data.keyMetrics || {
    totalSales: 0,
    totalProfit: 0,
    currentStockValue: 0,
    avgOrderValue: 0,
    salesGrowth: 0,
    profitMargin: 0,
    bestProduct: '',
    totalTransactions: 0,
    lowStockItems: 0
  }

  // Format month names for better display and ensure data validity
  const formattedSalesData = React.useMemo(() => {
    if (!Array.isArray(salesData) || salesData.length === 0) return []
    return salesData
      .filter(item => item && item.name && typeof item.sales === 'number' && typeof item.profit === 'number')
      .map((item: any) => {
        try {
          // Parse date/time from name
            const parts = item.name.split(' ')
            const [datePart, hourPart] = parts.length === 2 ? parts : [parts[0], null]
            const [y,m,d] = datePart.split('-').map(Number)
            let date: Date
            if (hourPart) {
              const hour = Number(hourPart.split(':')[0])
              date = new Date(y, m-1, d, hour)
            } else {
              date = new Date(y, m-1, d)
            }
            if (isNaN(date.getTime())) return null
            const nameLabel = timeGranularity === 'hour'
              ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', hour12: false })
              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            return {
              ...item,
              name: nameLabel,
              sales: Number(item.sales) || 0,
              profit: Number(item.profit) || 0
            }
        } catch (error) {
          console.warn('Error formatting sales data:', error)
          return null
        }
      })
      .filter(item => item !== null && item.name !== 'Invalid Date')
  }, [salesData, timeGranularity])

  const handleExport = (format: string) => {
    // For CSV export
    if (format === 'csv') {
      const csvContent = [
        // Header row
        ['Month', 'Sales', 'Profit', 'Inventory'].join(','),
        // Data rows
        ...formattedSalesData.map((item: any) =>
          [item.name, item.sales, item.profit, item.inventory].join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}-report.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    // For PDF export (would require a PDF library in production)
    else if (format === 'pdf') {
      console.log(`Exporting ${reportType} report as PDF`, data)
      alert('PDF export would be implemented with a library like jsPDF')
    }
  }

  // Assign color to each category by name
  const categoryColors = Object.fromEntries(
    (data.categoryData || []).map((cat: any) => [cat.name, getRandomColor(cat.name)])
  )

  // Extra sanitization specifically for AreaChart (root cause of runtime error)
  const sanitizedAreaData = React.useMemo(() => {
    return (salesData as any[])
      .filter(d => d && typeof d.sales === 'number' && isFinite(d.sales) && typeof d.profit === 'number' && isFinite(d.profit))
      .map(d => ({ ...d, sales: Number(d.sales), profit: Number(d.profit) }))
  }, [salesData])

  const areaDataIsValid = sanitizedAreaData.length === salesData.length && sanitizedAreaData.length > 0

  // Simple linear regression forecast for next 7 periods (daily) based on existing sanitizedAreaData
  const forecastData = React.useMemo(() => {
    const n = sanitizedAreaData.length
    if (n < 2) return []
    // Prepare indices as x values
    const xVals = Array.from({ length: n }, (_, i) => i)

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const mean = (arr: number[]) => sum(arr) / arr.length
    const xMean = mean(xVals)
    const salesVals = sanitizedAreaData.map(d => d.sales as number)
    const profitVals = sanitizedAreaData.map(d => d.profit as number)
    const ySalesMean = mean(salesVals)
    const yProfitMean = mean(profitVals)

    const calcSlope = (yVals: number[]) => {
      let num = 0
      let den = 0
      for (let i = 0; i < n; i++) {
        num += (xVals[i] - xMean) * (yVals[i] - (yVals === salesVals ? ySalesMean : yProfitMean))
        den += (xVals[i] - xMean) ** 2
      }
      return den === 0 ? 0 : num / den
    }

    const salesSlope = calcSlope(salesVals)
    const profitSlope = calcSlope(profitVals)
    const salesIntercept = ySalesMean - salesSlope * xMean
    const profitIntercept = yProfitMean - profitSlope * xMean

    // Determine last date
    const lastDateStr = sanitizedAreaData[n - 1].name
    const lastDate = new Date(lastDateStr)
    if (isNaN(lastDate.getTime())) return []

    const periods = 7 // forecast next 7 days
    const forecasts: any[] = []
    for (let i = 1; i <= periods; i++) {
      const x = n - 1 + i
      const salesForecast = salesSlope * x + salesIntercept
      const profitForecast = profitSlope * x + profitIntercept
      const futureDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000)
      forecasts.push({
        name: futureDate.toISOString().slice(0, 10),
        sales: null, // keep actual area from extending
        profit: null,
        salesForecast: Math.max(0, Math.round(salesForecast)),
        profitForecast: Math.max(0, Math.round(profitForecast)),
        isForecast: true
      })
    }
    return forecasts
  }, [sanitizedAreaData])

  // Combine actual + forecast for AreaChart
  const areaChartData = React.useMemo(() => {
    if (!forecastData.length) return sanitizedAreaData
    return [...sanitizedAreaData, ...forecastData]
  }, [sanitizedAreaData, forecastData])

  // Compute stock (lock) usage per location
  const stockLockUsage = React.useMemo(() => {
    if (!stockLocations.length || !products.length) return [] as { id: string; name: string; capacity: number; used: number; percent: number }[]
    const usageMap: Record<string, { name: string; capacity: number; used: number }> = {}
    stockLocations.forEach((loc: any) => {
      usageMap[loc._id] = { name: loc.name, capacity: loc.capacity || 0, used: 0 }
    })
    products.forEach(p => {
      if (p.stock_location_id && usageMap[p.stock_location_id]) {
        usageMap[p.stock_location_id].used += (p.quantity || 0)
      }
    })
    return Object.entries(usageMap).map(([id, v]) => ({
      id,
      name: v.name,
      capacity: v.capacity,
      used: v.used,
      percent: v.capacity > 0 ? (v.used / v.capacity) * 100 : 0
    })).sort((a,b) => b.percent - a.percent)
  }, [stockLocations, products])

  // Compute Sales & Profit contribution per category for stacked bar (two bars: Sales, Profit)
  const categoryContribution = React.useMemo(() => {
    if (!Array.isArray(data.salesTrend) || data.salesTrend.length === 0 || !Array.isArray(products) || products.length === 0) {
      return { rows: [], categories: [] as string[] }
    }

    const productMap = new Map(products.map(p => [p._id, p]))
    const categoryNameLookup = new Map(categories.map(c => [c._id, c.name]))
    const categoryAgg: Record<string, { name: string; sales: number; profit: number }> = {}

    data.salesTrend.forEach((trx: ITransaction) => {
      const trxProducts: any[] = Array.isArray(trx.products) ? trx.products : []
      const lineItems = trxProducts.map(pr => {
        const prod: any = productMap.get(pr.product_id)
        const price = pr.price ?? prod?.price ?? 0
        const qty = pr.quantity ?? 0
        const categoryId = prod?.category_id
        const categoryName = categoryId ? (categoryNameLookup.get(categoryId) || 'Unknown') : 'Unknown'
        return { categoryId, categoryName, value: price * qty }
      }).filter(li => li.value > 0 && li.categoryName)

      const trxValueSum = lineItems.reduce((a, b) => a + b.value, 0) || 0
      const trxProfit = Number(trx.profit) || 0

      lineItems.forEach(li => {
        const ratio = trxValueSum > 0 ? (li.value / trxValueSum) : 0
        if (!categoryAgg[li.categoryName]) {
          categoryAgg[li.categoryName] = { name: li.categoryName, sales: 0, profit: 0 }
        }
        categoryAgg[li.categoryName].sales += li.value
        categoryAgg[li.categoryName].profit += trxProfit * ratio
      })
    })

    const categoryNames = Object.keys(categoryAgg)
    if (categoryNames.length === 0) return { rows: [], categories: [] as string[] }

    const salesRow: any = { type: 'Sales' }
    const profitRow: any = { type: 'Profit' }
    categoryNames.forEach(cat => {
      salesRow[cat] = Number(categoryAgg[cat].sales.toFixed(2))
      profitRow[cat] = Number(categoryAgg[cat].profit.toFixed(2))
    })

    return { rows: [salesRow, profitRow], categories: categoryNames }
  }, [data.salesTrend, products, categories])

  // Unified tooltip components (currency & percent variants) styled consistently
  const CurrencyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null
    // Filter valid numeric entries (exclude structural keys like 'type')
    const rows = payload.filter((p: any) => p && p.dataKey !== 'type' && typeof p.value === 'number' && p.value !== null)
    if (rows.length === 0) return null
    const total = rows.reduce((a: number, p: any) => a + (Number(p.value) || 0), 0)
    const sorted = [...rows].sort((a, b) => (b.value || 0) - (a.value || 0))
    return (
      <div className="rounded-md border bg-white shadow-md p-3 text-xs space-y-1 min-w-[190px]">
        {label && <div className="font-semibold text-white mb-1 truncate">{label}</div>}
        {sorted.map((p: any) => {
          const val = Number(p.value) || 0
            // Annotation for forecast series
          const isForecast = /forecast/i.test(p.dataKey || '')
          const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0'
          return (
            <div key={p.dataKey} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 max-w-[120px] truncate">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: p.color }}></span>
                {p.dataKey}{isForecast && <span className="text-[10px] text-slate-400 ml-1">(F)</span>}
              </span>
              <span className="tabular-nums text-slate-600">{formatCurrency(val)} <span className="text-slate-400">({percent}%)</span></span>
            </div>
          )
        })}
        <div className="pt-1 mt-1 border-t text-slate-500 flex justify-between">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
    )
  }

  const PercentTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null
    const rows = payload.filter((p: any) => p && typeof p.value === 'number' && p.value !== null)
    if (rows.length === 0) return null
    const total = rows.reduce((a: number, p: any) => a + (Number(p.value) || 0), 0) || 100
    const sorted = [...rows].sort((a, b) => (b.value || 0) - (a.value || 0))
    return (
      <div className="rounded-md border bg-white shadow-md p-3 text-xs space-y-1 min-w-[180px]">
        {label && <div className="font-semibold text-white mb-1 truncate">{label}</div>}
        {sorted.map((p: any) => {
          const val = Number(p.value) || 0
          const percent = total > 0 ? (val).toFixed(2) : '0.00'
          return (
            <div key={p.name || p.dataKey} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 max-w-[120px] truncate">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: p.color }}></span>
                {p.name || p.dataKey}
              </span>
              <span className="tabular-nums text-slate-600">{percent}%</span>
            </div>
          )
        })}
      </div>
    )
  }

  // Progress metrics
  const salesVsInventoryPercent = React.useMemo(() => {
    const inventoryValue = keyMetrics.currentStockValue || 0
    if (inventoryValue <= 0) return 100
    const pct = (keyMetrics.totalSales / inventoryValue) * 100
    return Math.min(Math.max(pct, 0), 999)
  }, [keyMetrics.totalSales, keyMetrics.currentStockValue])

  const lowStockPercent = React.useMemo(() => {
    if (!products.length) return 0
    return (keyMetrics.lowStockItems / products.length) * 100
  }, [keyMetrics.lowStockItems, products.length])

  const categorySegments = React.useMemo(() => {
    if (!categories.length || !products.length) return [] as { name: string; count: number; percent: number; color: string }[]
    const counts: Record<string, number> = {}
    products.forEach(p => { counts[p.category_id || 'Unknown'] = (counts[p.category_id || 'Unknown'] || 0) + 1 })
    const mapped = Object.entries(counts).map(([catId, count]) => {
      const catName = categories.find(c => c._id === catId)?.name || 'Unknown'
      return { name: catName, count, color: getRandomColor(catName) }
    })
    const total = mapped.reduce((a, b) => a + b.count, 0) || 1
    return mapped.map(m => ({ ...m, percent: (m.count / total) * 100 }))
  }, [categories, products])

  // Gradient stops for revenue trend area based on top category sales share (period-wide)
  const revenueCategoryGradient = React.useMemo(() => {
    // Use categoryContribution first row (Sales) for shares
    if (!categoryContribution.rows.length) return [] as { name: string; color: string; start: number; end: number }[]
    const salesRow = categoryContribution.rows.find(r => r.type === 'Sales') as any
    if (!salesRow) return []
    const entries = Object.entries(salesRow)
      .filter(([k]) => k !== 'type')
      .map(([name, value]) => ({ name, value: typeof value === 'number' ? value : Number(value) || 0 }))
      .filter(e => e.value > 0)
    const total = entries.reduce((a, b) => a + b.value, 0)
    if (!total) return []
    // Sort descending by value
    entries.sort((a, b) => b.value - a.value)
    // Limit to top 5; group rest as Others
    const TOP_N = 5
    let top = entries.slice(0, TOP_N)
    if (entries.length > TOP_N) {
      const othersValue = entries.slice(TOP_N).reduce((a, b) => a + b.value, 0)
      top = [...top, { name: 'Others', value: othersValue }]
    }
    let cumulative = 0
    return top.map((e, idx) => {
      const share = e.value / total
      const start = cumulative
      cumulative += share
      const end = cumulative
      const palette = chartColors.stackedPalette
      const color = e.name === 'Others' ? '#94a3b8' : palette[idx % palette.length]
      return { name: e.name, color, start, end }
    })
  }, [categoryContribution])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.reports ?? "Reports & Analytics"}</h1>
          <p className="text-slate-600">{t.trackPerformance ?? "Track performance and generate insights."}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            {t.exportCSV ?? "Export CSV"}
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="h-4 w-4 mr-2" />
            {t.exportPDF ?? "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.reportFilters ?? "Report Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t.dateRange ?? "Date Range"}</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">{t["last7Days"] ?? "Last 7 Days"}</SelectItem>
                  <SelectItem value="last-30-days">{t["last30Days"] ?? "Last 30 Days"}</SelectItem>
                  <SelectItem value="last-3-months">{t["last3Months"] ?? "Last 3 Months"}</SelectItem>
                  <SelectItem value="last-6-months">{t["last6Months"] ?? "Last 6 Months"}</SelectItem>
                  <SelectItem value="last-year">{t["lastYear"] ?? "Last Year"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.reportType ?? "Report Type"}</Label>
              <Select value={reportType} onValueChange={setReportType} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">{t.salesReport ?? "Sales Report"}</SelectItem>
                  <SelectItem value="profit">{t.profitAnalysis ?? "Profit Analysis"}</SelectItem>
                  <SelectItem value="inventory">{t.inventoryReport ?? "Inventory Report"}</SelectItem>
                  <SelectItem value="category">{t.categoryPerformance ?? "Category Performance"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.startDate ?? "Start Date"}</Label>
              <Input type="date" disabled />
            </div>
            <div className="space-y-2">
              <Label>{t.endDate ?? "End Date"}</Label>
              <Input type="date" disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalSales ?? "Total Sales"}</CardTitle>
            <div className="bg-blue-500 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {loading ? "..." : formatCurrency(keyMetrics.totalSales || 0)}
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>{Number(keyMetrics.salesGrowth) > 0 ? '+' : ''}{keyMetrics.salesGrowth}% {t.fromLastPeriod ?? "from last period"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalProfit ?? "Total Profit"}</CardTitle>
            <div className="bg-green-500 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {loading ? "..." : formatCurrency(keyMetrics.totalProfit || 0)}
            </div>
            <div className="flex items-center text-sm text-green-600">
              <span>{keyMetrics.profitMargin || 0}% {t.profitMargin ?? "profit margin"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.inventoryValue ?? "Inventory Value"}</CardTitle>
            <div className="bg-purple-500 p-2 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {loading ? "..." : formatCurrency(keyMetrics.currentStockValue || 0)}
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <span>{t.currentStockValue ?? "Current stock value"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalTransactions ?? "Total Transactions"}</CardTitle>
            <div className="bg-orange-500 p-2 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {loading ? "..." : (keyMetrics.totalTransactions || 0)}
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <span>{t.avgOrderValue ?? "Avg"}: {formatCurrency(keyMetrics.avgOrderValue || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sales & Profit Trend - Enhanced */}
        <Card className="border border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {t.salesProfitTrend ?? "Sales & Profit Trend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartLoader height={350} label={t.loadingChart || 'Loading Chart'} />
            ) : (areaDataIsValid) ? (
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.area.sales} stopOpacity={0.85} />
                        <stop offset="95%" stopColor={chartColors.area.sales} stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.area.profit} stopOpacity={0.85} />
                        <stop offset="95%" stopColor={chartColors.area.profit} stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={chartColors.area.sales}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      name={t.sales ?? "Sales"}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke={chartColors.area.profit}
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                      name={t.profit ?? "Profit"}
                      isAnimationActive={false}
                    />
                    {/* Forecast dashed lines */}
                    <Line
                      type="monotone"
                      dataKey="salesForecast"
                      stroke={chartColors.area.sales}
                      strokeDasharray="5 5"
                      dot={false}
                      name={(t as any).salesForecast || "Sales Forecast"}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="profitForecast"
                      stroke={chartColors.area.profit}
                      strokeDasharray="5 5"
                      dot={false}
                      name={(t as any).profitForecast || "Profit Forecast"}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-slate-500">{(t as any).noSalesData || 'No sales data available for the selected period'}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Category - Enhanced */}
        <Card className="border border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              {t.salesByCategory ?? "Sales by Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartLoader height={350} label={t.loadingCategories || 'Loading Categories'} />
            ) : (categoryData && categoryData.length > 0) ? (
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData.filter(item => item && typeof item.value === 'number' && !isNaN(item.value))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                    >
                      {categoryData
                        .filter(item => item && typeof item.value === 'number' && !isNaN(item.value))
                        .map((entry, index: number) => (
                          <Cell key={`cell-${index}`} fill={chartColors.piePalette[index % chartColors.piePalette.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<PercentTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-slate-500">{(t as any).noCategoryData || 'No category data available'}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <Card className="border border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              {t.keyMetrics ?? "Key Performance Metrics"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{t.bestSellingProduct ?? "Best Selling Product"}</p>
                    <p className="font-semibold text-slate-900">{keyMetrics.bestProduct || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{t.avgProfitMargin ?? "Average Profit Margin"}</p>
                    <p className="font-semibold text-green-600">{keyMetrics.profitMargin}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{t.lowStockItems ?? "Low Stock Items"}</p>
                    <p className="font-semibold text-orange-600">{keyMetrics.lowStockItems}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales vs Profit by Category (Stacked) */}
        <Card className="border border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-indigo-600" />
              {t.salesByCategory ? `${t.salesByCategory} (${t.totalSales || 'Sales'} & ${t.totalProfit || 'Profit'})` : 'Sales & Profit by Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartLoader height={280} label={t.loading || 'Loading'} />
            ) : (categoryContribution.rows.length > 0) ? (
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryContribution.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="type" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend />
                    {categoryContribution.categories.map((catName, idx) => (
                      <Bar
                        key={catName}
                        dataKey={catName}
                        stackId="stack"
                        fill={chartColors.stackedPalette[idx % chartColors.stackedPalette.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <div className="text-slate-500">{(t as any).noCategoryContribution || 'No category contribution data'}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Indicators (Enhanced) */}
        <Card className="border border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              {t.salesProgress || (t as any).salesProgress || "Progress & Coverage"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 1. Sales vs Inventory Value (Break-even) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">{(t as any).salesVsCapital || 'Sales vs Inventory Capital'}</span>
                  <span className="font-medium tabular-nums">{salesVsInventoryPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 relative overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(salesVsInventoryPercent, 100)}%` }}></div>
                  {salesVsInventoryPercent > 100 && (
                    <span className="absolute right-1 top-0 text-[10px] text-white bg-blue-600/70 px-1 rounded">{(t as any).over || 'Over'}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 flex justify-between">
                  <span>{t.totalSales || 'Sales'}: {formatCurrency(keyMetrics.totalSales || 0)}</span>
                  <span>{t.inventoryValue || 'Inventory'}: {formatCurrency(keyMetrics.currentStockValue || 0)}</span>
                </p>
              </div>

              {/* 2. Low Stock vs Total Products */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">{(t as any).lowStockCoverage || 'Low Stock Coverage'}</span>
                  <span className="font-medium tabular-nums">{lowStockPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(lowStockPercent, 100)}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-500 flex justify-between">
                  <span>{t.lowStockItems || 'Low Stock'}: {keyMetrics.lowStockItems}</span>
                  <span>{t.totalProducts || 'Products'}: {products.length}</span>
                </p>
              </div>

              {/* 3. Category Distribution Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600">{(t as any).categoryDistribution || 'Category Distribution'}</span>
                  <span className="font-medium tabular-nums">{products.length}</span>
                </div>
                <div className="w-full h-4 rounded-md overflow-hidden flex ring-1 ring-slate-200">
                  {categorySegments.length === 0 ? (
                    <div className="w-full h-full bg-slate-200"></div>
                  ) : categorySegments.map(seg => (
                    <div
                      key={seg.name}
                      className="h-full text-[8px] flex items-center justify-center text-white/90"
                      style={{ width: `${seg.percent}%`, background: seg.color }}
                      title={`${seg.name}: ${seg.count} (${seg.percent.toFixed(1)}%)`}
                    >
                      {seg.percent > 8 && seg.name.slice(0, 10)}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {categorySegments.slice(0, 6).map(seg => (
                    <div key={seg.name} className="flex items-center gap-1 text-[10px] text-slate-600">
                      <span className="w-2 h-2 rounded-sm" style={{ background: seg.color }}></span>
                      <span className="truncate max-w-[70px]" title={seg.name}>{seg.name}</span>
                      <span className="tabular-nums">{seg.percent.toFixed(1)}%</span>
                    </div>
                  ))}
                  {categorySegments.length > 6 && (
                    <span className="text-[10px] text-slate-500">+{categorySegments.length - 6} {(t as any).more || 'more'}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Analysis */}
      {/* Storage Locks Usage Canvas */}
      <Card className="border border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-500" /> {(t as any).storageLocks || 'Storage Locks Usage'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stockLockUsage.length === 0 ? (
            <div className="text-slate-500 text-sm">{(t as any).noStorageLockData || 'No storage lock data'}</div>
          ) : (
            <div className="space-y-4">
              {stockLockUsage.map(loc => {
                const pct = loc.percent
                const color = pct >= 100 ? 'bg-rose-600' : pct >= 85 ? 'bg-orange-500' : 'bg-emerald-500'
                return (
                  <div key={loc.id} className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="font-medium text-white truncate" title={loc.name}>{loc.name}</span>
                      <span className="tabular-nums text-slate-600">{Math.min(pct, 999).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden relative ring-1 ring-slate-300">
                      <div className={`h-3 ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      {pct > 100 && (
                        <span className="absolute right-1 top-0 text-[10px] text-white bg-rose-600/80 px-1 rounded">{(t as any).over || 'Over'}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{(t as any).used || 'Used'}: {loc.used}</span>
                      <span>{(t as any).capacity || 'Capacity'}: {loc.capacity}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            {t.revenueTrend || "Revenue Trend Analysis"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ChartLoader height={300} label={t.loadingTrend || 'Loading Trend'} />
          ) : (formattedSalesData && formattedSalesData.length > 0) ? (
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={formattedSalesData}>
                  <defs>
                    <linearGradient id="revenueCategoryGradient" x1="0" y1="0" x2="1" y2="0">
                      {revenueCategoryGradient.length === 0 ? (
                        <>
                          <stop offset="0%" stopColor={chartColors.line.sales} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={chartColors.line.sales} stopOpacity={0.7} />
                        </>
                      ) : revenueCategoryGradient.flatMap(seg => {
                        const startPct = (seg.start * 100).toFixed(2) + '%'
                        const endPct = (seg.end * 100).toFixed(2) + '%'
                        return [
                          <stop key={seg.name + '-start'} offset={startPct} stopColor={seg.color} stopOpacity={0.9} />,
                          <stop key={seg.name + '-end'} offset={endPct} stopColor={seg.color} stopOpacity={0.7} />
                        ]
                      })}
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend />
                  {/* Area backdrop with category-based gradient */}
                  <Area type="monotone" dataKey="sales" stroke="transparent" fill="url(#revenueCategoryGradient)" isAnimationActive={false} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke={chartColors.line.sales}
                    strokeWidth={3}
                    dot={{ fill: chartColors.line.sales, strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: chartColors.line.sales, strokeWidth: 2 }}
                    name={t.revenue || "Revenue"}
                    connectNulls={false}
                    opacity={0.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke={chartColors.line.profit}
                    strokeWidth={3}
                    dot={{ fill: chartColors.line.profit, strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: chartColors.line.profit, strokeWidth: 2 }}
                    name={t.netProfit || "Net Profit"}
                    connectNulls={false}
                    opacity={0.5}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-slate-500">{(t as any).noRevenueTrendData || 'No revenue trend data available'}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}






