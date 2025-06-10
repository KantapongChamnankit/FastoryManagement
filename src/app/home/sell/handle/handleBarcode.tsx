import { IProduct } from "@/lib"
import * as ProductService from "@/lib/services/ProductService"

export async function handleBarcode(
    barcode: string,
    toast: any,
    setSelectedProduct: (product: IProduct[] | null) => void
) {
    try {
        await ProductService.findByBarcode(barcode)
            .then((product) => {
                if (product.quantity <= 0) {
                    toast({
                        title: "Out of Stock",
                        description: "This product is currently out of stock.",
                        variant: "destructive",
                    })
                } else {
                    setSelectedProduct(product)
                }
            })
            .catch((error) => {
                toast({
                    title: "Product not found",
                    description: "Please check the barcode and try again.",
                    variant: "destructive",
                })
            })
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to lookup product.",
            variant: "destructive",
        })
    }
}