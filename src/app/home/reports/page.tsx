"use client"

import { useEffect, useState } from "react"
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
  Legend
} from "recharts"
import { FileText, Download, Calendar, TrendingUp, DollarSign, Package } from "lucide-react"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import * as TransactionService from "@/lib/services/TransactionService"
import { ICategory, IProduct, ITransaction } from "@/lib"
import * as ProductService from "@/lib/services/ProductService"
import * as CategoryService from "@/lib/services/CategoryService"

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Helper to generate random pastel color
function getRandomColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = hash % 360
  return `hsl(${h}, 70%, 70%)`
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("last-6-months")
  const [reportType, setReportType] = useState("sales")
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<IProduct[]>([])
  const [data, setData] = useState<{ salesTrend: ITransaction[], categoryData: { name: string, value: number }[], keyMetrics: any }>({
    salesTrend: [],
    categoryData: [],
    keyMetrics: {}
  })
  const { lang } = useLanguage()
  const t = translations[lang]

  useEffect(() => {
    // Fetch products once on mount
    ProductService.list({}).then(setProducts).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    // fetch(`/api/reports?dateRange=${dateRange}&reportType=${reportType}`)
    //   .then(res => {
    //     if (!res.ok) {
    //       throw new Error(`HTTP error! Status: ${res.status}`)
    //     }
    //     return res.json()
    //   })
    //   .then(setData)
    //   .catch(error => {
    //     console.error("Error fetching report data:", error)
    //     // Provide fallback data if fetch fails
    //     setData({
    //       salesTrend: [],
    //       categoryData: [],
    //       keyMetrics: {}
    //     })
    //   })
    //   .finally(() => setLoading(false))
    TransactionService.list()
      .then((transactions) => {
        const sale = transactions.filter((t: ITransaction) => {
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

        console.log(sale, dateRange)

        CategoryService.list()
          .then(categories => {
            // Calculate total quantity sold for all categories
            const totalQuantity = sale.reduce((acc: number, t: ITransaction) => {
              return acc + t.products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)
            }, 0)

            const categoryData = categories.map((category: ICategory) => {
              // Find all products in this category
              const categoryProducts = products.filter((p: IProduct) => p.category_id === category._id)
              // For each product, sum quantity sold across all sales
              const productQuantities = categoryProducts.map((p: IProduct) =>
                sale.reduce((sum: number, t: ITransaction) => {
                  const product = t.products.find((prod: any) => prod.product_id === p._id)
                  return sum + (product ? product.quantity || 0 : 0)
                }, 0)
              )
              // Calculate average quantity for this category (avoid division by zero)
              const avgQuantity = productQuantities.length > 0
                ? productQuantities.reduce((a, b) => a + b, 0) / productQuantities.length
                : 0
              // Calculate percent (of total average quantity)
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

              return {
                name: category.name,
                value: Number(percent.toFixed(2))
              }
            })

            const keyMetrics = {
              totalSales: sale.reduce((acc: number, t: ITransaction) => acc + (t.total_price || 0), 0),
              totalProfit: sale.reduce((acc: number, t: ITransaction) => acc + (t.profit || 0), 0),
              currentStockValue: products.length ? products.reduce((acc: number, p: IProduct) => acc + (p.price * (p.quantity || 0)), 0) : 0,
              avgOrderValue: sale.length ? (sale.reduce((acc: number, t: ITransaction) => acc + (t.total_price || 0), 0) / sale.length) : 0,
              salesGrowth: sale.length ? ((sale[sale.length - 1].total_price - sale[0].total_price) / sale[0].total_price * 100).toFixed(2) : 0,
              profitMargin: sale.length ? ((sale.reduce((acc: number, t: ITransaction) => acc + (t.profit || 0), 0) / sale.reduce((acc: number, t: ITransaction) => acc + (t.total_price || 0), 0)) * 100).toFixed(2) : 0,
              bestProduct: sale.length
                ? (() => {
                  const id = sale.reduce(
                    (prev, curr: ITransaction) =>
                      curr.total_price > prev.total_price ? curr : prev,
                    sale[0]
                  ).products[0].product_id
                  const bestProduct = products.find((p: IProduct) => p._id === id)
                  return bestProduct ? bestProduct.name : ""
                })()
                : "",
              totalTransactions: sale.length,
              lowStockItems: sale.filter((t: ITransaction) => t.products.some((p: any) => p.quantity < 5)).length
            }

            console.log("Key Metrics:", keyMetrics)

            setData({ salesTrend: sale, categoryData, keyMetrics })
            setLoading(false)
          })
          .catch(error => {
            console.error(error)
            setData({
              salesTrend: sale,
              categoryData: [],
              keyMetrics: {}
            })
            setLoading(false)
          })
      })
  }, [dateRange, reportType, products]) // Re-fetch when filters change

  const salesData = data.salesTrend?.map((item) => ({
    name: new Date(item.created_at as number).toISOString().slice(0, 10), // Format to YYYY-MM
    sales: item.total_price || 0,
    profit: item.profit || 0,
    inventory: 0
  })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()) || []

  const categoryData: ICategory[] = data.categoryData || []
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
  } = data.keyMetrics || {}

  // Format month names for better display
  const formattedSalesData = salesData.map((item: any) => ({
    ...item,
    name: new Date(item.name + "-01").toLocaleDateString('en-US', { month: 'short' })
  }))

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t.totalSales ?? "Total Sales"}</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? "..." : formatCurrency(keyMetrics.totalSales || 0)}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{Number(keyMetrics.salesGrowth) > 0 ? '+' : ''}{keyMetrics.salesGrowth}% {t.fromLastPeriod ?? "from last period"}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t.totalProfit ?? "Total Profit"}</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? "..." : formatCurrency(keyMetrics.totalProfit || 0)}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <span>{keyMetrics.profitMargin || 0}% {t.profitMargin ?? "profit margin"}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t.inventoryValue ?? "Inventory Value"}</CardTitle>
            <Package className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{loading ? "..." : `$${keyMetrics.currentStockValue || 0}`}</div>
            <div className="flex items-center text-xs text-slate-600 mt-1">
              <span>{t.currentStockValue ?? "Current stock value"}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t.avgOrderValue ?? "Avg. Order Value"}</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? "..." : formatCurrency(keyMetrics.avgOrderValue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t.salesProfitTrend ?? "Sales & Profit Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Bar dataKey="sales" fill="#3b82f6" name={t.sales ?? "Sales"} />
                <Bar dataKey="profit" fill="#10b981" name={t.profit ?? "Profit"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t.salesByCategory ?? "Sales by Category"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index: number) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.name]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t.keyMetrics ?? "Key Metrics"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">{t.bestSellingProduct ?? "Best Selling Product"}</span>
                <span className="font-medium text-slate-900">{keyMetrics.bestProduct}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">{t.avgProfitMargin ?? "Average Profit Margin"}</span>
                <span className="font-medium text-green-600">{keyMetrics.profitMargin}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">{t.totalTransactions ?? "Total Transactions"}</span>
                <span className="font-medium text-slate-900">{keyMetrics.totalTransactions}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">{t.lowStockItems ?? "Low Stock Items"}</span>
                <span className="font-medium text-orange-600">{keyMetrics.lowStockItems}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}






