import { IUser } from "@/lib"
import * as CategoryService from "@/lib/services/CategoryService"

export async function handleDelete(categoryId: string, toast: any, fetchCategories: () => Promise<void>, user: IUser) {
    await CategoryService.remove(categoryId, user)
        .then(() => {
            toast({
                title: "Category deleted",
                description: "The category has been successfully deleted.",
            })
            fetchCategories()
        })
        .catch((error) => {
            toast({
                title: "Error",
                description: "Failed to delete category.",
                variant: "destructive",
            })
        })
}