import { IProduct } from "@/lib"
import { Dispatch, SetStateAction } from "react"

import * as ProductService from "@/lib/services/ProductService"

export async function fetchProducts(setLoading: (loading: boolean) => void, setProducts: (products: any[]) => void) {
    try {
        setLoading(true)
        const data = await ProductService.list({})
        setProducts(data as IProduct[])
        return true;
    } catch (error) {
        console.error("Error fetching products:", error)
        return false;
    } finally {
        setLoading(false)
    }
}