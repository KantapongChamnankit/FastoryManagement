import { IProduct, IStockLocation } from "@/lib"
import * as ProductService from "@/lib/services/ProductService"

export const handleEdit = async (product: IProduct, oldData: any, toast: any, fetchProducts: any, locks: (IStockLocation & { currentStock: number })[]) => {
    const updatedProduct: IProduct = {
        ...product,
        quantity: Number(product.quantity) || 0,
        price: Number(product.price) || 0,
        cost: Number(product.cost) || 0
    }

    const selectedLockObj = locks?.find((l) => l._id === product.stock_location_id)
    console.log("Selected lock object:", oldData)

    if (selectedLockObj && updatedProduct.quantity > ((selectedLockObj.capacity + oldData.quantity) - selectedLockObj.currentStock)) {
        toast({ title: `Quantity exceeds lock capacity (${selectedLockObj.capacity})`, variant: "destructive" })
        return
    }

    try {
        await ProductService.edit(product._id as string, updatedProduct)
            .then(() => {
                toast({ title: `Edited ${product.name}` })
                fetchProducts()
            })
            .catch(() => {
                toast({ title: "Failed to edit product", variant: "destructive" })
            })
    } catch {
        toast({ title: "Error editing product", variant: "destructive" })
    }
}