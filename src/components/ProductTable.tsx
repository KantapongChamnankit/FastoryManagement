import { Edit, ShoppingCart, Trash2 } from "lucide-react"
import { Card } from "./ui/card"
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

export function ProductTable({ filteredProducts, categories, locks, setSellProduct, setSellQuantity, setIsSellDialogOpen, setEditingProduct, setIsDeleteDialogOpen, setIsEditDialogOpen, setProductToDelete }: props) {
    const language = useLanguage()
    const t = translations[language.lang]

    return (
        <Card className="border border-slate-200 shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-200">
                        <TableHead className="font-semibold text-slate-700">{t.product}</TableHead>
                        <TableHead className="font-semibold text-slate-700">{t.barcode}</TableHead>
                        <TableHead className="font-semibold text-slate-700">{t.category}</TableHead>
                        <TableHead className="font-semibold text-slate-700">{t.lock}</TableHead>
                        <TableHead className="font-semibold text-slate-700">{t.quantity}</TableHead>
                        <TableHead className="font-semibold text-slate-700">{t.unitPrice}</TableHead>
                        <TableHead className="font-semibold text-slate-700">{t.status}</TableHead>
                        <TableHead className="font-semibold text-slate-700">{t.actions}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredProducts.map((product) => (
                        <TableRow key={product._id} className="border-b border-slate-100 hover:bg-slate-50">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={product._id ? `/api/images/${product.image_id}` : "/placeholder.svg"}
                                        alt={product.name}
                                        className="w-10 h-10 object-cover border border-slate-200"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">{product.name}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-slate-600">{product.barcode}</TableCell>
                            <TableCell className="text-slate-600">{categories.find((x) => x._id === product.category_id)?.name || ""}</TableCell>
                            <TableCell className="text-slate-600">{locks.find((x) => x._id === product.stock_location_id)?.name || ""}</TableCell>
                            <TableCell className="text-slate-600">{product.quantity}</TableCell>
                            <TableCell className="text-slate-600">฿{product.price}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={(product.quantity > 0) ? "default" : "destructive"}
                                    className={
                                        (product.quantity > 0) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }
                                >
                                    {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                            setSellProduct(product)
                                            setSellQuantity(1)
                                            setIsSellDialogOpen(true)
                                        }}
                                    >
                                        <ShoppingCart className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                            setEditingProduct(product)
                                            setIsEditDialogOpen(true)
                                        }}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                        onClick={() => {
                                            setProductToDelete(product)
                                            setIsDeleteDialogOpen(true)
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
}