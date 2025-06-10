import { IProduct } from "@/lib"
import * as TransactionService from "@/lib/services/TransactionService"
import * as ProductService from "@/lib/services/ProductService"

export async function handleSell(
    selectedProduct: IProduct,
    quantity: number,
    toast: any,
    setBarcode: (barcode: string) => void,
    setQuantity: (quantity: number) => void,
    setSelectedProduct: (product: IProduct | null) => void,
    fetchTransaction: (
        setSales: (sales: any[]) => void,
        setTodaySales: (sales: number) => void,
        setTodayProfit: (profit: number) => void,
        setTodayTransactions: (count: number) => void,
        toast: any
    ) => Promise<void>,
    setSales: (sales: any[]) => void,
    setTodaySales: (sales: number) => void,
    setTodayProfit: (profit: number) => void,
    setTodayTransactions: (count: number) => void
) {
    if (selectedProduct && quantity > 0) {
        await ProductService.sell(selectedProduct._id as string, quantity)
            .then((product) => {
                toast({
                    title: "Sale completed successfully",
                    description: `Sold ${quantity} x ${selectedProduct.name}`,
                })
                // Reset form
                setBarcode("")
                setQuantity(1)
                setSelectedProduct(null)
                // Refresh sales and stats
                fetchTransaction(
                    setSales,
                    setTodaySales,
                    setTodayProfit,
                    setTodayTransactions,
                    toast
                )
            })
            .catch((error) => {
                toast({
                    title: "Error",
                    description: "Failed to complete sale.",
                    variant: "destructive",
                })
            })
    }
}