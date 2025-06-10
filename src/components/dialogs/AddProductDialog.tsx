import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Package, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { AddProductForm } from "../forms/AddProductForm"
import { ICategory, IStockLocation } from "@/lib"

export function AddProductDialog({ onClose, fetchProducts, isAddDialogOpen, setIsAddDialogOpen, categories, locks }: { onClose: () => void; fetchProducts: () => void, isAddDialogOpen: boolean, setIsAddDialogOpen: (open: boolean) => void, categories: ICategory[], locks: (IStockLocation & { currentStock: number })[] }) {
    const language = useLanguage()
    const t = translations[language.lang]
    return (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    {t.addProduct}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t.addNewProduct}</DialogTitle>
                </DialogHeader>
                {/* <AddProductForm
                    onClose={() => {
                        onClose()
                        setIsAddDialogOpen(false)
                    }}
                    fetchProducts={fetchProducts}
                    categories={categories}
                    locks={locks}
                /> */}
            </DialogContent>
        </Dialog>
    )
}