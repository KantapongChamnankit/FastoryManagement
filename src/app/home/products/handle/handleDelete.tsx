import { IProduct, IUser } from "@/lib"
import * as ProductService from "@/lib/services/ProductService"

export async function handleDelete(product: IProduct, toast: any, fetchProducts: () => Promise<void>, user: IUser) {
    try {
        await ProductService.remove(product._id as string, user)
            .then(() => {
                toast({ title: "Product deleted successfully", variant: "success" })
                fetchProducts()
            })
            .catch((error) => {
                console.error("Error deleting product:", error)
                toast({ title: "Error deleting product", variant: "destructive" })
            })
    } catch {
        toast({ title: "Error deleting product", variant: "destructive" })
    }
}