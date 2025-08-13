"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingCart, Scan, Plus, Minus, DollarSign, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { usePermissions } from "@/hooks/use-permissions"
import { PermissionGate } from "@/components/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import { fetchTransaction } from "./handle/fetchTransaction"
import type { IProduct, ITransaction, IUser } from "@/lib"
import * as ProductService from "@/lib/services/ProductService"
import * as UserService from "@/lib/services/UserService"
import { useSession } from "next-auth/react"
import * as TransactionService from "@/lib/services/TransactionService"
import Loading from "./loading"
import { useTheme } from "next-themes"
import { fetchProducts } from "../products/handle/fetchProducts"

interface CartItem extends IProduct {
  cartQuantity: number
}

export default function SellPage() {
  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [sales, setSales] = useState<ITransaction[]>([])
  const [todaySales, setTodaySales] = useState(0)
  const [todayProfit, setTodayProfit] = useState(0)
  const [todayTransactions, setTodayTransactions] = useState(0)
  const [products, setProducts] = useState<IProduct[]>([])
  const [user, setUser] = useState<IUser | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const { lang } = useLanguage()
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const { userRole } = usePermissions()

  const t = translations[lang]

  useEffect(() => {
    fetchTransaction(setSales, setTodaySales, setTodayProfit, setTodayTransactions, toast).then(() => {
      async function fetchProductData() {
        setProducts(await ProductService.list({}))
        return
      }

      async function fetchUser() {
        const userId = (session as any)?.user?.id as string
        if (userId) {
          const userData = await UserService.findById(userId)
          setUser(userData)
          return
        }
        return
      }
      Promise.all([
        fetchProductData(),
        fetchUser(),

      ]).then(() => {
        if (userRole !== null) {
          setLoading(false)
        }
      })
    })
  }, [userRole])

  const handleBarcodeSubmit = async () => {
    if (!barcode.trim()) return

    try {
      // Find product by barcode
      const product = products.find((p) => p.barcode === barcode)

      if (product) {
        // Check if product already in cart
        const existingItemIndex = cart.findIndex((item) => item.barcode === barcode)

        if (product.quantity <= 0) {
          toast({
            title: "Insufficient stock",
            description: `${product.name} (${product.barcode}) is out of stock.`,
            variant: "destructive",
          })
          return
        }
        if (existingItemIndex >= 0) {
          // Increase quantity if already in cart
          const updatedCart = [...cart]
          if (updatedCart[existingItemIndex].cartQuantity < updatedCart[existingItemIndex].quantity) {
            updatedCart[existingItemIndex].cartQuantity += 1
            setCart(updatedCart)
            toast({
              title: "Quantity updated",
              description: `${product.name} (${product.barcode})`,
            })
          } else {
            toast({
              title: "Insufficient stock",
              description: `${"Maximum available"}: ${product.quantity}`,
              variant: "destructive",
            })
          }
        } else {
          // Add new item to cart
          setCart([...cart, { ...product, cartQuantity: 1 }])
          toast({
            title: "Added to cart",
            description: product.name,
          })
        }
      }
    } catch (error) {
      console.error("Error finding product:", error)
      toast({
        title: t.error || "Error",
        description: t.failedToFindProduct ?? "Failed to find product",
        variant: "destructive",
      })
    }

    // Clear barcode input for next scan
  }

  const updateCartQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }

    const updatedCart = [...cart]
    const maxAvailable = updatedCart[index].quantity

    if (newQuantity > maxAvailable) {
      toast({
        title: "Insufficient stock",
        description: `${"Maximum available"}: ${maxAvailable}`,
        variant: "destructive",
      })
      newQuantity = maxAvailable
    }

    updatedCart[index].cartQuantity = newQuantity
    setCart(updatedCart)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to cart first",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Create transaction with all cart items
      const transaction: ITransaction = {
        products: cart.map((item) => ({
          product_id: item._id as string,
          quantity: item.cartQuantity,
          price: item.price,
          cost: item.cost,
        })),
        total_price: cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0),
        profit: cart.reduce((sum, item) => sum + (item.price - item.cost) * item.cartQuantity, 0),
        user_id: user?._id,
        total_cost: cart.reduce((sum, item) => sum + item.cost * item.cartQuantity, 0),
      }

      await TransactionService.createTransaction(transaction)

      // Update product quantities
      for (const item of cart) {
        await ProductService.updateQuantity(item._id as string, -item.cartQuantity, user as IUser)
      }

      toast({
        title: "Sale completed",
        description: `${cart.reduce((sum, item) => sum + item.cartQuantity, 0)} ${"items sold"}`,
      })

      // Clear cart and refresh data
      Promise.all([
        fetchTransaction(setSales, setTodaySales, setTodayProfit, setTodayTransactions, toast),
        fetchProducts((load) => { setLoading(load) }, (products) => setProducts(products))
      ]).then(() => {
        setCart([])
      })
    } catch (error) {
      console.error("Error processing sale:", error)
      toast({
        title: t.error || "Error",
        description: t.failedToCompleteSale ?? "Failed to complete sale",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    async function fetchProductByBarcode() {
      const product = products.find((p) => p.barcode === barcode.trim())
      if (product) {
        handleBarcodeSubmit()
        setBarcode("")
      }
    }

    fetchProductByBarcode()
  }, [barcode])

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.cartQuantity, 0)
  const getTotalAmount = () => cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0)
  const getTotalProfit = () => cart.reduce((sum, item) => sum + (item.price - item.cost) * item.cartQuantity, 0)

  return (
    loading ? (<Loading theme={theme ?? "light"} />) : (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.sellProduct}</h1>
          <p className="text-slate-600">{t.salesCompletedToday}</p>
        </div>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
          {/* Sale Form */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="border border-slate-200 shadow-sm flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t.sell}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Barcode Scanner */}
                <div className="space-y-2">
                  <Label htmlFor="barcode">{t.barcode}</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      id="barcode"
                      placeholder={t.scanOrEnterBarcode}
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleBarcodeSubmit()}
                      className="flex-1 min-w-[120px]"
                    />
                    <Button
                      variant="outline"
                      onClick={handleBarcodeSubmit}
                      disabled={!barcode.trim()}
                      title={t.search || "Search"}
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCart([])}
                      disabled={cart.length === 0}
                      title={t.clear || "Clear"}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Cart */}
                {cart.length > 0 ? (
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-sm overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-slate-200">
                            <TableHead className="font-semibold text-slate-700">{t.product}</TableHead>
                            <TableHead className="font-semibold text-slate-700">{t.stockPricing}</TableHead>
                            <TableHead className="font-semibold text-slate-700">{t.quantity}</TableHead>
                            <TableHead className="font-semibold text-slate-700">{t.total}</TableHead>
                            <TableHead className="font-semibold text-slate-700">{t.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cart.map((item, index) => (
                            <TableRow key={item._id} className="border-b border-slate-100 hover:bg-slate-50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {item.image_id && (
                                    <img
                                      src={"/api/images/" + item.image_id}
                                      alt={item.name}
                                      className="w-10 h-10 object-cover border border-slate-200"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.barcode}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600">${item.price.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateCartQuantity(index, item.cartQuantity - 1)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={item.cartQuantity}
                                    onChange={(e) => updateCartQuantity(index, Number.parseInt(e.target.value) || 0)}
                                    className="w-14 text-center h-7 px-1"
                                    min="1"
                                    max={item.quantity}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateCartQuantity(index, item.cartQuantity + 1)}
                                    className="h-7 w-7 p-0"
                                    disabled={item.cartQuantity >= item.quantity}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-slate-900">
                                ${(item.price * item.cartQuantity).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(index)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Cart Summary */}
                    <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          {t.itemsStored}: {getTotalItems()}
                        </span>
                        <span className="font-medium text-slate-900">${getTotalAmount().toFixed(2)}</span>
                      </div>
                      <PermissionGate permission={PERMISSIONS.SALES_VIEW_PROFIT}>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">{t.profit}:</span>
                          <span className="font-medium text-green-600">${getTotalProfit().toFixed(2)}</span>
                        </div>
                      </PermissionGate>
                      <Button
                        onClick={handleConfirmSale}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Processing..." : "Confirm Sale"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 h-full">
                    <div className="flex items-center justify-center flex-col h-60">
                      <p className="mb-4">{t.scanOrEnterBarcode}</p>
                      <p className="text-sm">{t.enterBarcode}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2 h-full flex flex-col">
            <PermissionGate permission={PERMISSIONS.SALES_VIEW_PROFIT} fallback={<></>}>
              <Card className="border border-slate-200 shadow-sm h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-600">{t.totalProfit}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    ${todayProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <DollarSign className="h-3 w-3 mr-1" />
                    <span>
                      {todaySales > 0 ? `${Math.round((todayProfit / todaySales) * 100)}% ${t.profit}` : `0% ${t.profit}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </PermissionGate>
            <Card className="border border-slate-200 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600">{t.todaysSales}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  ${todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-slate-200 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600">{t.transactions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{todayTransactions}</div>
                <p className="text-xs text-slate-500 mt-1">{t.salesCompletedToday}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Sales */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 text-center">
                  <TableHead className="font-semibold text-slate-700 text-center">{t.product}</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">{t.quantity}</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">{t.unitPrice}</TableHead>
                  <PermissionGate permission={PERMISSIONS.SALES_VIEW_PROFIT}>
                    <TableHead className="font-semibold text-slate-700 text-center">{t.profit}</TableHead>
                  </PermissionGate>
                  <TableHead className="font-semibold text-slate-700 text-center">{t.time || "Time"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales
                  .filter((x, i) => i < 10)
                  .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
                  .map((sale) => (
                    <TableRow key={sale._id || sale._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900 text-center">
                        {products.find((x) => x._id === sale.products[0].product_id)?.name ? (
                          <span>{products.find((x) => x._id === sale.products[0].product_id)?.name}</span>
                        ) : (
                          <span className="flex justify-center items-center">
                            <div className="bg-slate-50 animate-pulse">
                              <div className="h-4 w-28 bg-slate-200 rounded"></div>
                            </div>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 text-center">{sale.products[0].quantity}</TableCell>
                      <TableCell className="text-slate-600 text-center">${sale.total_price?.toFixed(2) ?? ""}</TableCell>
                      <PermissionGate permission={PERMISSIONS.SALES_VIEW_PROFIT}>
                        <TableCell className="text-green-600 font-medium text-center">${sale.profit?.toFixed(2) ?? ""}</TableCell>
                      </PermissionGate>
                      <TableCell className="text-slate-500 text-sm text-center">
                        {sale.created_at
                          ? new Date(sale.created_at as number)
                            .toLocaleString("th-TH", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })
                            .replace(/(\d+)\/(\d+)\/(\d+),\s?(\d+):(\d+)/, "$3/$2/$1 $4:$5")
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  )
}
