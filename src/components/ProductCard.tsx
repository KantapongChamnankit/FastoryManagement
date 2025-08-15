import { Edit, Grid3X3, LockIcon, Package, ShoppingCart, Trash2 } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { ICategory, IProduct, IStockLocation } from "@/lib"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"

interface props {
    filteredProducts: IProduct[],
    categories: ICategory[],
    locks: (IStockLocation & { currentStock: number })[],
    setSellProduct: (product: IProduct) => void,
    setSellQuantity: (quantity: number) => void,
    setIsSellDialogOpen: (open: boolean) => void,
    setEditingProduct: (product: IProduct) => void,
    setIsEditDialogOpen: (open: boolean) => void,
    setProductToDelete: (product: IProduct) => void,
    setIsDeleteDialogOpen: (open: boolean) => void
}

export function ProductCard({ filteredProducts, categories, locks, setSellProduct, setSellQuantity, setIsSellDialogOpen, setEditingProduct, setIsDeleteDialogOpen, setIsEditDialogOpen, setProductToDelete }: props) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
                <Card
                    key={product._id}
                    className="border border-slate-200 shadow-sm hover:shadow-lg transition-shadow group relative overflow-hidden"
                >
                    <CardContent className="p-3 sm:p-4 flex flex-col h-full">
                        <div className="relative mb-3 flex items-center justify-center bg-slate-50 rounded-lg h-28 sm:h-32 overflow-hidden">
                            <img
                                src={product.image_id ? `/api/images/${product.image_id}` : "/placeholder.svg"}
                                alt={product.name}
                                className="object-contain h-full w-full transition-transform group-hover:scale-105"
                            />
                            {product.quantity === 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute top-2 right-2 bg-red-100 text-red-700"
                                >
                                    {
                                        product.quantity > 0 ? "In Stock" : `Out of Stock`
                                    }
                                </Badge>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>
                                    <Grid3X3 className="inline h-3 w-3 mr-1" />
                                    {product.barcode}
                                </span>
                                <span>
                                    <Package className="inline h-3 w-3 mr-1" />
                                    {categories.find((x) => x._id === product.category_id)?.name || "Uncategorized"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>
                                    <LockIcon className="inline h-3 w-3 mr-1" />
                                    {locks.find((x) => x._id === product.stock_location_id)?.name || "No Lock"}
                                </span>
                                <span>
                                    <ShoppingCart className="inline h-3 w-3 mr-1" />
                                    Qty: {product.quantity}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-base sm:text-lg font-bold text-blue-700">฿{product.price}</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    title="Sell"
                                    onClick={() => {
                                        setSellProduct(product)
                                        setSellQuantity(1)
                                        setIsSellDialogOpen(true)
                                    }}
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    title="Edit"
                                    onClick={() => {
                                        setEditingProduct(product)
                                        setIsEditDialogOpen(true)
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    title="Delete"
                                    onClick={() => {
                                        setProductToDelete(product)
                                        setIsDeleteDialogOpen(true)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}