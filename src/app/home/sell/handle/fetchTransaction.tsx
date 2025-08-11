import { ITransaction } from "@/lib";
import * as TransactionService from "@/lib/services/TransactionService";


export async function fetchTransaction(
    setSales: (sales: ITransaction[]) => void,
    setTodaySales: (sales: number) => void,
    setTodayProfit: (profit: number) => void,
    setTodayTransactions: (count: number) => void,
    toast: any
) {
    try {
        await TransactionService.list()
            .then((transactions) => {
                setSales(transactions);
                const today = new Date()
                const todayStr = today.toISOString().slice(0, 10)
                let salesSum = 0
                let profitSum = 0
                let txCount = 0

                transactions.forEach((sale) => {
                    const saleDate = new Date(sale.created_at || " ").toISOString().slice(0, 10)
                    if (saleDate === todayStr) {
                        salesSum += sale.total_price
                        profitSum += (sale.profit || 0)
                        txCount += 1
                    }
                })

                setTodaySales(salesSum)
                setTodayProfit(profitSum)
                setTodayTransactions(txCount)
                return;
            })
        return;
    } catch (error) {
        toast({ title: "Error", description: "Failed to fetch sales.", variant: "destructive" })
        return
    }
}