"use client"

import type React from "react"

import { use, useEffect, useState } from "react"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Scan, Plus, Minus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AddProductForm } from "../forms/AddProductForm"
import * as ProductService from "@/lib/services/ProductService"
import * as CategoryService from "@/lib/services/CategoryService"
import * as StockLocationService from "@/lib/services/StockLocationService"
import { ICategory, IProduct, IStockLocation } from "@/lib"
import { usePermissions } from "@/hooks/use-permissions"

interface Product {
    _id?: string
    name: string
    barcode: string
    category: string
    lock: string
    quantity: number
    unitPrice: number
    lotCost: number
    image?: string
}

interface CartItem extends Product {
    cartQuantity: number
}

interface BarcodeScannerModalProps {
    isOpen: boolean
    onClose: () => void
    mode: "add" | "sell"
    onConfirm: (items: CartItem[]) => void
    fetchProducts: () => void
}

export function BarcodeScannerModal({ isOpen, onClose, mode, onConfirm, fetchProducts }: BarcodeScannerModalProps) {
    const { lang } = useLanguage()
    const t = translations[lang] || translations.en
    const [barcode, setBarcode] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [newProduct, setNewProduct] = useState<Partial<Product> | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [categories, setCategories] = useState<ICategory[]>([])
    const [locks, setLocks] = useState<(IStockLocation & { currentStock: number })[]>([])
    const { toast } = useToast()
    const { isAdmin, isStaff } = usePermissions()

    useEffect(() => {
        if (barcode.trim() && barcode.length >= 8) {
            handleBarcodeSubmit()
        }
    }, [barcode])

    const handleBarcodeSubmit = async () => {
        if (!barcode.trim()) return

        setIsScanning(true)
        ProductService.findByBarcode(barcode)
            .then((product) => {
                setIsScanning(false)
                if (product) {
                    const existingItem = cart.find((item) => item.barcode === product.barcode)
                    if (existingItem) {
                        updateCartQuantity(product.barcode, existingItem.cartQuantity + 1)
                    } else {
                        setCart([
                            ...cart,
                            {
                                _id: product._id,
                                name: product.name,
                                barcode: product.barcode,
                                category: (product as any).category ?? (product as any).category_id ?? "",
                                lock: (product as any).lock ?? (product as any).stock_location_id ?? "",
                                quantity: product.quantity,
                                unitPrice: (product as any).unitPrice ?? (product as any).price ?? 0,
                                lotCost: (product as any).lotCost ?? (product as any).cost ?? 0,
                                image: product.image_id ?? (product as any).image_id,
                                cartQuantity: 1,
                            }
                        ])
                    }
                    setBarcode("")
                } else {
                    if (isAdmin()) {
                        setNewProduct({ barcode })
                    } else {
                        toast({
                            title: t.productNotFound || "Product Not Found",
                            description: t.pleaseCheckBarcode || "Please check the barcode.",
                            variant: "destructive",
                        })
                    }
                    setBarcode("")
                }
            })
    }

    const updateCartQuantity = (barcode: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(barcode)
            return
        }

        setCart(cart.map((item) => (item.barcode === barcode ? { ...item, cartQuantity: newQuantity } : item)))
    }

    const removeFromCart = (barcode: string) => {
        setCart(cart.filter((item) => item.barcode !== barcode))
    }

    const handleConfirm = () => {
        if (cart.length === 0 && !newProduct) {
            toast({
                title: t.emptyCart || "Empty cart",
                description: t.pleaseAddItemsToCart || "Please add items to cart first",
                variant: "destructive",
            })
            return
        }

        onConfirm(cart)
        setCart([])
        setNewProduct(null)
        setBarcode("")
        onClose()
    }

    useEffect(() => {
        const fetchCategoriesAndLocks = async () => {
            try {
                CategoryService.list()
                    .then((data) => setCategories(data))
                StockLocationService.list()
                    .then(async (data) => {
                        const products = await ProductService.list({})
                        const stockLocations = data.map(lock => ({
                            ...lock,
                            currentStock: products.filter(p => p.stock_location_id === lock._id).reduce((sum, p_1) => sum + p_1.quantity, 0)
                        }))
                        setLocks(stockLocations)
                    })
            } catch (error) {
                console.error("Failed to fetch categories or locks", error)
            }
        }

        fetchCategoriesAndLocks()
    }, [])

    const getTotalItems = () => cart.reduce((sum, item) => sum + item.cartQuantity, 0)
    const getTotalValue = () => cart.reduce((sum, item) => sum + item.unitPrice * item.cartQuantity, 0)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? (t.addProductsToInventory || "Add Products to Inventory") : (t.scanProductsToSell || "Scan Products to Sell")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Barcode Scanner */}
                    <div className="space-y-4">
                        <Label htmlFor="barcode">{t.barcodeInputLabel || "Scan or Enter Barcode"}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="barcode"
                                placeholder={t.barcodeInputPlaceholder || "Scan or enter barcode"}
                                value={barcode}
                                onChange={(e) => {
                                    setBarcode(e.target.value)
                                }}
                                onKeyPress={(e) => e.key === "Enter" && handleBarcodeSubmit()}
                                className="flex-1"
                            />
                            <Button variant="outline" onClick={handleBarcodeSubmit} disabled={isScanning}>
                                <Scan className="h-4 w-4" />
                            </Button>
                            <Button variant="outline">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* New Product Form */}
                    {newProduct && mode === "add" && (
                        <div className="border border-slate-200 dark:border-gray-700 p-4 space-y-4">
                            <AddProductForm
                                onAdd={(product: IProduct) => {
                                    setCart([
                                        ...cart,
                                        {
                                            _id: product._id,
                                            name: product.name,
                                            barcode: product.barcode,
                                            category: product.category_id,
                                            lock: product.stock_location_id,
                                            quantity: 1,
                                            unitPrice: product.price,
                                            lotCost: product.cost,
                                            image: product.image_id,
                                            cartQuantity: 1,
                                        }
                                    ])
                                    setNewProduct(null)
                                    setBarcode("")
                                }}
                                onClose={() => {
                                    setNewProduct(null)
                                    setBarcode("")
                                }}
                                barcode={newProduct.barcode!}
                                fetchProducts={() => {
                                    fetchProducts()
                                }}
                                categories={categories}
                                locks={locks}
                            />
                        </div>
                    )}

                    {/* Cart */}
                    {cart.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">
                                    {mode === "add" ? (t.productsToAdd || "Products to Add") : (t.itemsToSell || "Items to Sell")} ({getTotalItems()} {t.itemsCount || "items"})
                                </h3>
                                {mode === "sell" && (
                                    <div className="text-lg font-bold text-orange-600">{t.totalAmount || "Total"}: ${getTotalValue().toFixed(2)}</div>
                                )}
                            </div>

                            <div className="border border-slate-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                                {cart.map((item) => (
                                    <div
                                        key={item.barcode}
                                        className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-gray-800 last:border-0"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-gray-400">
                                                {item.barcode} • ${item.unitPrice}
                                                {mode === "sell" && item.quantity < item.cartQuantity && (
                                                    <span className="text-red-500 ml-2">({t.onlyQuantityAvailable || "Only"} {item.quantity} {t.quantityAvailable || "available"})</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateCartQuantity(item.barcode, item.cartQuantity - 1)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Input
                                                type="number"
                                                value={item.cartQuantity}
                                                onChange={(e) => updateCartQuantity(item.barcode, Number.parseInt(e.target.value) || 0)}
                                                className="w-16 text-center h-8"
                                                min="0"
                                                max={mode === "sell" ? item.quantity : undefined}
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateCartQuantity(item.barcode, item.cartQuantity + 1)}
                                                className="h-8 w-8 p-0"
                                                disabled={mode === "sell" && item.cartQuantity >= item.quantity}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => removeFromCart(item.barcode)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-gray-700">
                        <Button variant="outline" onClick={onClose}>
                            {t.cancel || "Cancel"}
                        </Button>
                        {cart.length > 0 && (
                            <Button onClick={handleConfirm} className="bg-orange-600 hover:bg-orange-700">
                                {mode === "add" ? (t.addToInventory || "Add to Inventory") : (t.confirmSale || "Confirm Sale")}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
