"use client"

import { useEffect, useState } from "react"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Tags, Search, ShoppingBag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import * as CategoryService from "@/lib/services/CategoryService"
import * as ProductService from "@/lib/services/ProductService"
import { ICategory, IProduct, IUser } from "@/lib"
import * as UserService from "@/lib/services/UserService"
import { useSession } from "next-auth/react"
import { AddCategoryDialog } from "@/components/dialogs/AddCategoryDialog"
import { handleDelete } from "./handle/handleDelete"
import { CategoryForm } from "@/components/forms/AddCategoryForm"
import Loading from "./loading"
import { useTheme } from "next-themes"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null)
  const [products, setProducts] = useState<IProduct[]>([])
  const [user, setUser] = useState<IUser | null>(null)
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const { theme } = useTheme()
  const lang = useLanguage()
  const t = translations[lang.lang] || translations.en

  async function fetchCategories() {
    const categories = await CategoryService.list();
    setCategories(categories)
  }

  async function fetchProducts() {
    const products = await ProductService.list({});
    setProducts(products)
  }

  async function fetchUser() {
    const userId = (session as any).user.id as string
    const userData = await UserService.findById(userId)
    setUser(userData)
  }

  useEffect(() => {
    fetchUser()
    fetchProducts()
    fetchCategories().then(() => {
      setLoading(false)
    })
  }, [])

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    loading ? <Loading theme={theme ?? "dark"} /> :
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.categories}</h1>
          <p className="text-slate-600">{t.organizeCategories}</p>
        </div>
        <AddCategoryDialog
          fetchCategories={fetchCategories}
          isAddDialogOpen={isAddDialogOpen}
          setIsAddDialogOpen={setIsAddDialogOpen}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder={t.search + " " + t.categories + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Table */}
      <Card className="border border-slate-200 shadow-sm">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-10 w-10 text-slate-400 mb-4" />
            <span className="text-slate-500 mb-4">{(t as any).notHaveCategory || "No categories found. You can create one!"}</span>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.addCategory || "Add Category"}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200">
          <TableHead className="font-semibold text-slate-700">{t.categoryName}</TableHead>
          <TableHead className="font-semibold text-slate-700">{t.description}</TableHead>
          <TableHead className="font-semibold text-slate-700">{t.products}</TableHead>
          <TableHead className="font-semibold text-slate-700">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
          <TableRow key={category._id} className="border-b border-slate-100 hover:bg-slate-50">
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center bg-blue-100 text-blue-600">
            <Tags className="h-4 w-4" />
                </div>
                <span className="font-medium text-slate-900">{category.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-slate-600">{category.description}</TableCell>
            <TableCell className="text-slate-600">{products.filter((x) => x.category_id as string === category._id).length} {t.products}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {/* Edit Dialog */}
                <Dialog open={editingCategory?._id === category._id} onOpenChange={open => setEditingCategory(open ? category : null)}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setEditingCategory(category)}>
                <Edit className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.editCategory}</DialogTitle>
              </DialogHeader>
              <CategoryForm
                category={category}
                onClose={() => setEditingCategory(null)}
                fetchCategories={fetchCategories}
                t={t}
              />
            </DialogContent>
                </Dialog>
                {/* Delete Button with Confirm Dialog */}
                <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                onClick={() => setDeleteCategoryId(category._id as string)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t.confirmDeleteCategory || "Are you sure you want to delete this category?"}
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteCategoryId(null)}>
                  {t.cancel || "Cancel"}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
              if (!deleteCategoryId) return;
              ProductService.list({ category_id: deleteCategoryId }).then(products => {
                if (products.length > 0) {
                  products.forEach(product => {
                    ProductService.remove(product._id as string, user as IUser);
                  });
                  return;
                }
              });
              await handleDelete(category._id as string, toast, fetchCategories, user as IUser);
              setDeleteCategoryId(null);
                  }}
                >
                  {t.delete || "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}