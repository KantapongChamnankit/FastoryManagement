"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, DollarSign, TrendingUp, ShoppingCart, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"

import * as ProductService from "@/lib/services/ProductService"
import * as TransactionService from "@/lib/services/TransactionService"
import * as ActivityService from "@/lib/services/ActivityService"
import { IActivity } from "@/lib"
import { useSession } from "next-auth/react"

export default function Dashboard() {
  const [productCount, setProductCount] = useState(0)
  const [todaySales, setTodaySales] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [salesData, setSalesData] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const lang = useLanguage()
  const t = translations[lang.lang] || translations.en

  useEffect(() => {
    async function fetchProducts() {
      const productList = await ProductService.list({})
      setProductCount(productList.length)

      const lowStockProducts = await ProductService.getLowStock(10)
      setLowStockCount(lowStockProducts.length)
    }

    async function fetchSales() {
      const sales = await TransactionService.list()
      const todaySales = await TransactionService.getTodaySummary()
      setTodaySales(todaySales.total_sales || 0)
      setTotalProfit(todaySales.total_profit || 0)

      const chartMap: Record<string, { sales: number; profit: number }> = {}
      sales.forEach((sale) => {
        const date = new Date(sale?.created_at as number ?? 0).toISOString().slice(0, 10) // YYYY-MM-DD
        if (!chartMap[date]) chartMap[date] = { sales: 0, profit: 0 }
        chartMap[date].sales += (sale.total_price || 0)
        chartMap[date].profit += (sale.profit || 0)
      })
      setSalesData(
        Object.entries(chartMap).map(([name, val]) => ({
          name,
          ...val,
        }))
      )
    }

    async function fetchActivities() {
      const recentActivity = await ActivityService.getRecent(5)
      setActivities(recentActivity.map((activity) => ({
        ...activity,
        time: activity.created_at ? new Date(activity.created_at).toISOString() : null,
      })))
    }

    fetchProducts()
    fetchSales()
    fetchActivities()
  }, [])

  return (
    <>
      {/* Main Content (add left margin for navbar) */}
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{t.dashboard}</h1>
            <p className="text-slate-600">{t.welcome}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{t.totalProducts}</CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{productCount.toLocaleString()}</div>
              {/* You can add a trend here if you calculate it */}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{t.todaysSales}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{t.totalProfit}</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{t.lowStock}</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{lowStockCount}</div>
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <span>{t.requiresAttention}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">{t.salesTrend}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Bar dataKey="sales" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">{t.profitTrend}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">{t.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity: IActivity) => (
                <div
                  key={activity._id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 ${activity.action === "create"
                        ? "bg-green-500"
                        : activity.action === "sale"
                          ? "bg-blue-500"
                          : activity.action === "update"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                    />
                    <div>
                      <p className="text-sm text-slate-500">{activity.details}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.created_at
                      ? new Date(activity.created_at).toLocaleString("th-TH", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).replace(/(\d+)\/(\d+)\/(\d+),\s?(\d+):(\d+)/, "$3/$2/$1 $4:$5")
                      : ""}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
