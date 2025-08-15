"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { buildPromptPayPayload } from "@/lib/utils/promptpay"
import { ShoppingCart, Scan, Plus, Minus, DollarSign, Trash, Calculator } from "lucide-react"
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
import { getSettings } from "@/lib/services/SettingService"
import * as TransactionService from "@/lib/services/TransactionService"
import Loading from "./loading"
import { useTheme } from "next-themes"
import { fetchProducts } from "../products/handle/fetchProducts"
import { adjustForMobile } from "@/lib/utils"

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
  const [productQuery, setProductQuery] = useState("")
  const [user, setUser] = useState<IUser | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const { lang } = useLanguage()
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const { userRole } = usePermissions()
  const [isMobile, setIsMobile] = useState(false)

  const [openSaleInfo, setOpenSaleInfo] = useState(false)
  const [selectedSale, setSelectedSale] = useState<ITransaction | null>(null)
  const [calcOpen, setCalcOpen] = useState(false)
  const [calcDisplay, setCalcDisplay] = useState<string>("0")
  const [calcPrev, setCalcPrev] = useState<number | null>(null)
  const [calcOp, setCalcOp] = useState<"+" | "-" | "*" | "/" | null>(null)
  const [calcAwaitingNext, setCalcAwaitingNext] = useState<boolean>(false)

  // Checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"QR" | "CASH">("CASH")
  const [discount, setDiscount] = useState<number>(0)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [promptPayPhone, setPromptPayPhone] = useState<string>("")
  const computeNetTotal = () => Math.max(0, getTotalAmount() - (discount || 0))
  const computeChange = () => Math.max(0, (cashReceived || 0) - computeNetTotal())
  const [copied, setCopied] = useState(false)
  const digitsOnly = (s: string) => (s || "").replace(/\D+/g, "")
  const phoneDigits = digitsOnly(promptPayPhone)
  const phoneValid = phoneDigits.length >= 9

  const handleDigit = (d: string) => {
    setCalcDisplay((current) => {
      if (calcAwaitingNext) {
        setCalcAwaitingNext(false)
        return d
      }
      if (current === "0") return d
      return current + d
    })
  }

  const handleDecimal = () => {
    setCalcDisplay((current) => {
      if (calcAwaitingNext) {
        setCalcAwaitingNext(false)
        return "0."
      }
      return current.includes(".") ? current : current + "."
    })
  }

  const compute = (a: number, b: number, op: "+" | "-" | "*" | "/") => {
    switch (op) {
      case "+": return a + b
      case "-": return a - b
      case "*": return a * b
      case "/": return b === 0 ? NaN : a / b
    }
  }

  const handleOp = (op: "+" | "-" | "*" | "/") => {
    const current = Number(calcDisplay)
    if (calcPrev === null) {
      setCalcPrev(current)
    } else if (calcOp && !calcAwaitingNext) {
      const result = compute(calcPrev, current, calcOp)
      setCalcPrev(result)
      setCalcDisplay(String(Number.isNaN(result) ? "Error" : Number(result.toFixed(8))))
    }
    setCalcOp(op)
    setCalcAwaitingNext(true)
  }

  const handleEquals = () => {
    if (calcOp === null || calcPrev === null) return
    const current = Number(calcDisplay)
    const result = compute(calcPrev, current, calcOp)
    setCalcDisplay(String(Number.isNaN(result) ? "Error" : Number(result.toFixed(8))))
    setCalcPrev(null)
    setCalcOp(null)
    setCalcAwaitingNext(false)
  }

  const t = translations[lang]
  useEffect(() => {
    const handle = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1400)
    handle()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])


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

  const addProductToCart = (product: IProduct) => {
    if (!product) return
    const existingItemIndex = cart.findIndex((item) => item.barcode === product.barcode)

    if (product.quantity <= 0) {
      toast({
        title: "Insufficient stock",
        description: `${product.name} (${product.barcode}) is out of stock.`,
        variant: "destructive",
      })
      return
    }

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      if (updatedCart[existingItemIndex].cartQuantity < updatedCart[existingItemIndex].quantity) {
        updatedCart[existingItemIndex].cartQuantity += 1
        setCart(updatedCart)
        toast({ title: "Quantity updated", description: `${product.name} (${product.barcode})` })
      } else {
        toast({
          title: "Insufficient stock",
          description: `${"Maximum available"}: ${product.quantity}`,
          variant: "destructive",
        })
      }
    } else {
      setCart([...cart, { ...product, cartQuantity: 1 }])
      toast({ title: "Added to cart", description: product.name })
    }
  }

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

  const handleConfirmSaleWithPayment = async () => {
    if (cart.length === 0) return
    setIsProcessing(true)
    try {
  const gross = getTotalAmount()
  const totalAfterDiscount = computeNetTotal()
      const transaction: ITransaction = {
        products: cart.map((item) => ({
          product_id: item._id as string,
          quantity: item.cartQuantity,
          price: item.price,
          cost: item.cost,
        })),
        total_price: totalAfterDiscount,
        profit: cart.reduce((sum, item) => sum + (item.price - item.cost) * item.cartQuantity, 0) - (discount || 0),
        user_id: user?._id,
        total_cost: cart.reduce((sum, item) => sum + item.cost * item.cartQuantity, 0),
        payment_method: paymentMethod,
        discount: discount || 0,
        cash_received: paymentMethod === "CASH" ? (cashReceived || 0) : undefined,
        change: paymentMethod === "CASH" ? Math.max(0, (cashReceived || 0) - totalAfterDiscount) : undefined,
        qr_payload: paymentMethod === "QR" && promptPayPhone ? buildPromptPayPayload(promptPayPhone, totalAfterDiscount) : undefined,
      }

      await TransactionService.createTransaction(transaction)
      for (const item of cart) {
        await ProductService.updateQuantity(item._id as string, -item.cartQuantity, user as IUser)
      }
      toast({ title: (t as any).paymentSuccess || "Payment successful" })
      Promise.all([
        fetchTransaction(setSales, setTodaySales, setTodayProfit, setTodayTransactions, toast),
        fetchProducts((load) => { setLoading(load) }, (products) => setProducts(products))
      ]).then(() => {
        setCart([])
        setDiscount(0)
        setCashReceived(0)
        setPromptPayPhone("")
      })
    } catch (e) {
      console.error(e)
      toast({ title: t.error || "Error", description: (t as any).paymentFailed || "Payment failed", variant: "destructive" })
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

  const filteredProducts = products
    .filter((p) =>
      productQuery.trim()
        ? (p.name?.toLowerCase() ?? "").includes(productQuery.toLowerCase()) ||
        (p.barcode ?? "").toLowerCase().includes(productQuery.toLowerCase())
        : true
    )
    .slice(0, 100)

  return (
    loading ? (<Loading theme={theme ?? "light"} />) : (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{t.sellProduct}</h1>
          <p className="text-slate-600">{t.salesCompletedToday}</p>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6 lg:grid lg:grid-cols-3">
          {/* Sale Form */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="border border-slate-200 shadow-sm flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t.sell}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
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
                      className="flex-1 min-w-[100px] h-9 sm:h-10"
                    />
                    <Button
                      variant="outline"
                      onClick={handleBarcodeSubmit}
                      disabled={!barcode.trim()}
                      title={t.search || "Search"}
                      className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCart([])}
                      disabled={cart.length === 0}
                      title={t.clear || "Clear"}
                      className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={"outline"}
                      className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                      title={"Calculator"}
                      onClick={() => setCalcOpen(true)}
                    >
                      <Calculator className="h-4 w-4" />
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
                            <TableHead className="font-semibold text-slate-700 text-xs sm:text-sm">{t.product}</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs sm:text-sm">{t.stockPricing}</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs sm:text-sm">{t.quantity}</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs sm:text-sm">{t.total}</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs sm:text-sm">{t.actions}</TableHead>
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
                                      className="w-9 h-9 sm:w-10 sm:h-10 object-cover border border-slate-200"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.barcode}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600 text-sm sm:text-base">${item.price.toFixed(2)}</TableCell>
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
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const s = await getSettings()
                            // @ts-ignore legacy settings may not have this key
                            if ((s as any)?.promptPayPhone) setPromptPayPhone((s as any).promptPayPhone)
                          } catch {}
                          setCheckoutOpen(true)
                        }}
                        className="mt-2"
                        disabled={cart.length === 0}
                        title={(t as any).checkout || "Checkout"}
                      >
                        {(t as any).checkout || "Checkout"}
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

          {/* Product Picker */}
          <div className="h-full flex flex-col">
            <Card className="border border-slate-200 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600">{(t as any).products || "Products"}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    placeholder={(t as any).searchProducts || "Search products by name or barcode"}
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="-mx-2 px-2 overflow-y-auto max-h-[50vh] lg:max-h-[520px]">
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">{(t as any).noProducts || "No products"}</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const inCart = cart.find((c) => c.barcode === p.barcode)
                        const canAddMore = (inCart?.cartQuantity ?? 0) < p.quantity
                        return (
                          <li key={p._id as string} className="py-1.5 sm:py-2 flex items-center gap-3">
                            {p.image_id ? (
                              <img
                                src={`/api/images/${p.image_id}`}
                                alt={p.name}
                                className="w-9 h-9 sm:w-10 sm:h-10 object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 border border-slate-200" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="truncate">{p.barcode}</span>
                                <span>•</span>
                                <span>${p.price.toFixed(2)}</span>
                                <span>•</span>
                                <span>{(t as any).stock || "Stock"}: {p.quantity}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addProductToCart(p)}
                              disabled={!canAddMore}
                              title={canAddMore ? ((t as any).add || "Add") : ((t as any).outOfStock || "Out of stock")}
                              className="shrink-0 h-8 px-2"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats moved below */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <PermissionGate permission={PERMISSIONS.SALES_VIEW_PROFIT} fallback={<></>}>
            <Card className="border border-slate-200 shadow-sm">
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
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">{t.todaysSales}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ${todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">{t.transactions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{todayTransactions}</div>
              <p className="text-xs text-slate-500 mt-1">{t.salesCompletedToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 text-center">
                  <TableHead className="font-semibold text-slate-700 text-center">
                    <span className="sm:hidden">สินค้า</span>
                    <span className="hidden sm:inline">{isMobile ? adjustForMobile(t.product, 10) : t.product}</span>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">
                    <span className="sm:hidden">จำนวน</span>
                    <span className="hidden sm:inline">{t.quantity}</span>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">
                    <span className="sm:hidden">ราคาต่อหน่วย</span>
                    <span className="hidden sm:inline">{t.unitPrice}</span>
                  </TableHead>
                  <PermissionGate permission={PERMISSIONS.SALES_VIEW_PROFIT}>
                    <TableHead className="font-semibold text-slate-700 text-center hidden sm:table-cell">{t.profit}</TableHead>
                  </PermissionGate>
                  <TableHead className="font-semibold text-slate-700 text-center hidden sm:table-cell">{t.time || "Time"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales
                  .filter((x, i) => i < 10)
                  .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
                  .map((sale) => (
                    <TableRow
                      key={sale._id || sale._id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setSelectedSale(sale)
                        setOpenSaleInfo(true)
                      }}
                    >
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
                      <TableCell className="text-slate-600 text-center">${(sale.products?.[0]?.price ?? 0).toFixed(2)}</TableCell>
                      <PermissionGate permission={PERMISSIONS.SALES_VIEW_PROFIT}>
                        <TableCell className="text-green-600 font-medium text-center hidden sm:table-cell">${sale.profit?.toFixed(2) ?? ""}</TableCell>
                      </PermissionGate>
                      <TableCell className="text-slate-500 text-sm text-center hidden sm:table-cell">
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

        {/* Sale info modal */}
        <Dialog open={openSaleInfo} onOpenChange={setOpenSaleInfo}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-lg">{(t as any).saleDetails || "Sale details"}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {(t as any).tapToClose || "Tap outside to close"}
              </DialogDescription>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-3">
                {(() => {
                  const prod = products.find((p) => p._id === selectedSale.products[0].product_id)
                  const qty = selectedSale.products[0].quantity
                  const unit = selectedSale.products?.[0]?.price ?? 0
                  const total = qty * unit
                  return (
                    <div className="flex items-start gap-3">
                      {prod?.image_id ? (
                        <img
                          src={`/api/images/${prod.image_id}`}
                          alt={prod.name}
                          className="w-16 h-16 object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 border border-slate-200" />)
                      }
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">{(prod?.name ?? (t as any).loading) || "Loading..."}</p>
                        <p className="text-xs text-slate-500 truncate">{prod?.barcode ?? ""}</p>
                        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                          <span className="text-slate-600">{t.quantity}</span>
                          <span className="text-right font-medium">{qty}</span>
                          <span className="text-slate-600">{t.unitPrice}</span>
                          <span className="text-right font-medium">${unit.toFixed(2)}</span>
                          <span className="text-slate-600">{t.total}</span>
                          <span className="text-right font-semibold text-slate-900">${total.toFixed(2)}</span>
                          <PermissionGate permission={PERMISSIONS.SALES_VIEW_PROFIT}>
                            <>
                              <span className="text-slate-600">{t.profit}</span>
                              <span className="text-right font-medium text-green-600">${selectedSale.profit?.toFixed(2) ?? ""}</span>
                            </>
                          </PermissionGate>
                          <span className="text-slate-600">{t.time || "Time"}</span>
                          <span className="text-right text-slate-700">
                            {selectedSale.created_at
                              ? new Date(selectedSale.created_at as number)
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
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Simple Calculator */}
        <Dialog open={calcOpen} onOpenChange={(open) => {
          setCalcOpen(open)
          if (!open) {
            // optional: keep last state; no reset
          }
        }}>
          <DialogContent className="sm:max-w-[360px]">
            <DialogHeader>
              <DialogTitle className="text-lg">{(t as any).calculator || "Calculator"}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {(t as any).simpleCalc || "Simple calculator"}
              </DialogDescription>
            </DialogHeader>
            <div className="border border-slate-200 bg-slate-50 text-right p-3 text-2xl font-mono tracking-wider select-none overflow-x-auto">
              {calcDisplay}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {/* Row 1 */}
              <Button variant="outline" onClick={() => { setCalcDisplay("0"); setCalcPrev(null); setCalcOp(null); setCalcAwaitingNext(false); }}>C</Button>
              <Button variant="outline" onClick={() => { setCalcDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0")); }}>⌫</Button>
              <span />
              <Button variant="outline" onClick={() => handleOp("/")}>÷</Button>

              {/* Row 2 */}
              <Button variant="outline" onClick={() => handleDigit("7")}>7</Button>
              <Button variant="outline" onClick={() => handleDigit("8")}>8</Button>
              <Button variant="outline" onClick={() => handleDigit("9")}>9</Button>
              <Button variant="outline" onClick={() => handleOp("*")}>×</Button>

              {/* Row 3 */}
              <Button variant="outline" onClick={() => handleDigit("4")}>4</Button>
              <Button variant="outline" onClick={() => handleDigit("5")}>5</Button>
              <Button variant="outline" onClick={() => handleDigit("6")}>6</Button>
              <Button variant="outline" onClick={() => handleOp("-")}>−</Button>

              {/* Row 4 */}
              <Button variant="outline" onClick={() => handleDigit("1")}>1</Button>
              <Button variant="outline" onClick={() => handleDigit("2")}>2</Button>
              <Button variant="outline" onClick={() => handleDigit("3")}>3</Button>
              <Button variant="outline" onClick={() => handleOp("+")}>+</Button>

              {/* Row 5 */}
              <Button variant="outline" onClick={() => handleDigit("0")} className="col-span-2">0</Button>
              <Button variant="outline" onClick={handleDecimal}>.</Button>
              <Button onClick={handleEquals} className="bg-blue-600 hover:bg-blue-700 text-white">=</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Checkout Dialog */}
        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{(t as any).checkout || "Checkout"}</DialogTitle>
              <DialogDescription>
                {(t as any).reviewAndPay || "Review your order and choose a payment method"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="border border-slate-200 rounded p-3">
                  <div className="flex justify-between text-sm"><span>{t.itemsStored}</span><span>{getTotalItems()}</span></div>
                  <div className="flex justify-between text-sm"><span>{t.total}</span><span>${getTotalAmount().toFixed(2)}</span></div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span>{(t as any).discount || "Discount"}</span>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={0} value={discount} onChange={(e)=> {
                        const gross = getTotalAmount()
                        let v = Number(e.target.value)
                        if (Number.isNaN(v)) v = 0
                        v = Math.max(0, Math.min(v, gross))
                        setDiscount(v)
                      }} className="h-8 w-28 text-right" />
                    </div>
                  </div>
                  {discount > getTotalAmount() && (
                    <div className="text-xs text-red-500 mt-1">{(t as any).discountTooHigh || "Discount exceeds total"}</div>
                  )}
                  <div className="flex justify-between font-semibold mt-2">
                    <span>{(t as any).netTotal || "Net Total"}</span>
                    <span>${computeNetTotal().toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500">{(t as any).note || "Note: discounts reduce the amount to pay."}</div>
              </div>
              <div className="space-y-3">
                <Tabs value={paymentMethod} onValueChange={(v)=> setPaymentMethod(v as any)}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="CASH">{(t as any).cash || "Cash"}</TabsTrigger>
                    <TabsTrigger value="QR">{(t as any).qrCode || "QR Code"}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="CASH" className="space-y-3">
                    <div>
                      <Label htmlFor="cashInput">{(t as any).cashReceived || "Cash received"}</Label>
                      <Input id="cashInput" type="number" value={cashReceived} onChange={(e)=> setCashReceived(Number(e.target.value)||0)} className="mt-1" />
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>{(t as any).change || "Change"}</span>
                      <span>${computeChange().toFixed(2)}</span>
                    </div>
                    <Button disabled={cart.length===0 || cashReceived < computeNetTotal() || isProcessing} onClick={async ()=>{
                      await handleConfirmSaleWithPayment()
                      setCheckoutOpen(false)
                    }} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{(t as any).confirmPayment || "Confirm Payment"}</Button>
                  </TabsContent>
                  <TabsContent value="QR" className="space-y-3">
                    <div>
                      <Label htmlFor="ppPhone">{(t as any).promptPayPhone || "PromptPay phone"}</Label>
                      <Input id="ppPhone" placeholder="08x-xxx-xxxx" value={promptPayPhone} onChange={(e)=> setPromptPayPhone(e.target.value)} className="mt-1" />
                      {!phoneValid && promptPayPhone && (
                        <div className="text-xs text-red-500 mt-1">{(t as any).invalidPhone || "Please enter a valid phone number"}</div>
                      )}
                    </div>
                    <div className="border border-dashed border-slate-300 rounded p-3 text-center">
                      {promptPayPhone ? (
                        <>
                          <div className="text-xs text-slate-500 mb-2">{(t as any).scanToPay || "Scan to pay"}</div>
                          <div className="text-[10px] break-all select-all">{buildPromptPayPayload(promptPayPhone, computeNetTotal())}</div>
                          <div className="mt-2 flex justify-center">
                            <Button size="sm" variant="outline" onClick={async ()=>{
                              try {
                                await navigator.clipboard.writeText(buildPromptPayPayload(promptPayPhone, computeNetTotal()))
                                setCopied(true)
                                setTimeout(()=> setCopied(false), 1500)
                                toast({ title: (t as any).copied || "Copied" })
                              } catch {}
                            }}>{copied ? ((t as any).copied || "Copied") : ((t as any).copyPayload || "Copy payload")}</Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-500">{(t as any).enterPhoneToGenerate || "Enter phone to generate QR payload"}</div>
                      )}
                    </div>
                    <Button disabled={cart.length===0 || !promptPayPhone || !phoneValid || isProcessing} onClick={async ()=>{
                      await handleConfirmSaleWithPayment()
                      setCheckoutOpen(false)
                    }} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{(t as any).markAsPaid || "Mark as paid"}</Button>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  )
}
