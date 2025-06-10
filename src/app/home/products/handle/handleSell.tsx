import { IProduct } from "@/lib";
import * as ProductService from "@/lib/services/ProductService";
import * as TransactionService from "@/lib/services/TransactionService";

export const handleSell = async (product: IProduct, quantity = 1, toast: any, fetchProducts: any) => {
    try {
        await ProductService.sell(product._id as string, quantity)
            .then((updatedProduct) => {
                toast({ title: `Sold ${quantity} unit(s) of ${product.name}` });
                fetchProducts();
            })
            .catch((error) => {
                console.error("Error selling product:", error);
                toast({ title: "Failed to sell product", variant: "destructive" });
            })
    } catch {
        toast({ title: "Error selling product", variant: "destructive" })
    }
}