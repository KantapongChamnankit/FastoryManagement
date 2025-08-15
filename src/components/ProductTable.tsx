"use client"
import { useEffect, useState } from "react"
import { Edit, ShoppingCart, Trash2, Copy, Check } from "lucide-react"
import { Card } from "./ui/card"
import { ICategory, IProduct, IStockLocation } from "@/lib"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { adjustForMobile } from "@/lib/utils"

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
    const [mobileInfoOpen, setMobileInfoOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const handle = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1400)
        handle()
        window.addEventListener('resize', handle)
        return () => window.removeEventListener('resize', handle)
    }, [])

    return (
        <Card className="border border-slate-200 shadow-sm w-full">
            <div className="w-full overflow-x-auto">
                <Table className="min-w-0">
                    <TableHeader>
                        <TableRow className="border-b border-slate-200">
                            <TableHead className="font-semibold text-slate-700">{t.product}</TableHead>
                            <TableHead className="font-semibold text-slate-700 hidden md:table-cell">{t.barcode}</TableHead>
                            <TableHead className="font-semibold text-slate-700 hidden md:table-cell">{t.category}</TableHead>
                            <TableHead className="font-semibold text-slate-700 hidden md:table-cell">{t.lock}</TableHead>
                            <TableHead className="font-semibold text-slate-700">{t.quantity}</TableHead>
                            <TableHead className="font-semibold text-slate-700 hidden md:table-cell">{t.unitPrice}</TableHead>
                            <TableHead className="font-semibold text-slate-700 hidden md:table-cell">{t.status}</TableHead>
                            <TableHead className="font-semibold text-slate-700 hidden md:table-cell">{t.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow
                                key={product._id}
                                className="border-b border-slate-100 hover:bg-slate-50 md:hover:bg-transparent cursor-pointer md:cursor-default"
                                onClick={() => {
                                    if (isMobile) {
                                        setSelectedProduct(product)
                                        setMobileInfoOpen(true)
                                    }
                                }}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={product._id ? `/api/images/${product.image_id}` : "/placeholder.svg"}
                                            alt={product.name}
                                            className="w-10 h-10 object-cover border border-slate-200 shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{isMobile ? adjustForMobile(product.name ?? '', 15) : product.name}</p>
                                            {/* Mobile-only status */}
                                            <div className="mt-1 md:hidden">
                                                <Badge
                                                    variant={(product.quantity > 0) ? "default" : "destructive"}
                                                    className={(product.quantity > 0) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                                >
                                                    {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-600 hidden md:table-cell">{isMobile ? adjustForMobile(product.barcode ?? '', 18, { position: 'middle' }) : product.barcode}</TableCell>
                                <TableCell className="text-slate-600 hidden md:table-cell">{(() => {
                                    const name = categories.find((x) => x._id === product.category_id)?.name || ""
                                    return isMobile ? adjustForMobile(name, 18) : name
                                })()}</TableCell>
                                {locks.find((x) => x._id === product.stock_location_id)?.name ? (
                                    <TableCell className="text-slate-600 hidden md:table-cell">{(() => {
                                        const name = locks.find((x) => x._id === product.stock_location_id)?.name || ""
                                        return isMobile ? adjustForMobile(name, 18) : name
                                    })()}</TableCell>
                                ) : (
                                    <TableCell className="text-slate-600 hidden md:table-cell">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 animate-pulse">
                                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell className="text-slate-600">{product.quantity}</TableCell>
                                <TableCell className="text-slate-600 hidden md:table-cell">฿{product.price}</TableCell>
                                {
                                    isMobile ? (
                                        <TableCell className="hidden">
                                            <Badge
                                                variant={(product.quantity > 0) ? "default" : "destructive"}
                                                className={(product.quantity > 0) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                            >
                                                {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                                            </Badge>
                                        </TableCell>
                                    ) : (
                                        <TableCell className="">
                                            <Badge
                                                variant={(product.quantity > 0) ? "default" : "destructive"}
                                                className={(product.quantity > 0) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                            >
                                                {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                                            </Badge>
                                        </TableCell>
                                    )
                                }
                                <TableCell className="hidden md:table-cell">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
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
                                            onClick={(e) => {
                                                e.stopPropagation()
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
                                            onClick={(e) => {
                                                e.stopPropagation()
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
            </div>
            {/* Mobile info modal */}
            <Dialog open={mobileInfoOpen} onOpenChange={(open) => { setMobileInfoOpen(open); if (!open) setCopied(false) }}>
                <DialogContent className="max-w-sm sm:max-w-md bg-slate-900 text-white border border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">{selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={selectedProduct.image_id ? `/api/images/${selectedProduct.image_id}` : "/placeholder.svg"}
                                    alt={selectedProduct.name}
                                    className="w-16 h-16 object-cover border border-slate-700 rounded"
                                />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm"><span className="font-medium text-white/80">{t.barcode}:</span> {selectedProduct.barcode}</div>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            title={copied ? 'Copied' : 'Copy barcode'}
                                            className="h-8 w-8"
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(selectedProduct.barcode || '')
                                                    setCopied(true)
                                                    setTimeout(() => setCopied(false), 1500)
                                                } catch (e) {
                                                    // ignore
                                                }
                                            }}
                                        >
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                <div className="text-white/80">{t.unitPrice}</div>
                                <div>฿{selectedProduct.price}</div>
                                <div className="text-white/80">{t.quantity}</div>
                                <div>{selectedProduct.quantity}</div>
                                <div className="text-white/80">{t.category}</div>
                                <div>{categories.find((x) => x._id === selectedProduct.category_id)?.name || ''}</div>
                                <div className="text-white/80">{t.lock}</div>
                                <div>{locks.find((x) => x._id === selectedProduct.stock_location_id)?.name || ''}</div>
                                <div className="text-white/80">{t.status}</div>
                                <div>
                                    <Badge className={selectedProduct.quantity > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                                        {selectedProduct.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <Button size="sm" variant="outline" onClick={() => {
                                    setSellProduct(selectedProduct)
                                    setSellQuantity(1)
                                    setIsSellDialogOpen(true)
                                    setMobileInfoOpen(false)
                                }}>
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    <span>Sell</span>
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                    setEditingProduct(selectedProduct)
                                    setIsEditDialogOpen(true)
                                    setMobileInfoOpen(false)
                                }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    <span>Edit</span>
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-400 hover:text-red-500" onClick={() => {
                                    setProductToDelete(selectedProduct)
                                    setIsDeleteDialogOpen(true)
                                    setMobileInfoOpen(false)
                                }}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <span>Delete</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    )
}