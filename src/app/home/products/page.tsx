"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Search, Grid3X3, List, Edit, Trash2, ShoppingCart, Package, Camera, LockIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"

import * as CetegoryService from "@/lib/services/CategoryService"
import * as StockLocationService from "@/lib/services/StockLocationService"
import * as ProductService from "@/lib/services/ProductService"
import * as UserService from "@/lib/services/UserService"

import { ICategory, IProduct, IStockLocation, IUser, User } from "@/lib"
import { AddProductDialog } from "@/components/dialogs/AddProductDialog"
import { handleSell } from "./handle/handleSell"
import { handleEdit } from "./handle/handleEdit"
import { fetchProducts } from "./handle/fetchProducts"
import { ProductTable } from "@/components/ProductTable"
import { ProductCard } from "@/components/ProductCard"
import { SellProductForm } from "@/components/forms/SellProductForm"
import { EditProductForm } from "@/components/forms/EditProductForm"
import { DeleteProductForm } from "@/components/forms/DeleteProductForm"
import { handleDelete } from "./handle/handleDelete"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { BarcodeScannerModal } from "@/components/dialogs/BarcodeDialog"


export default function ProductsPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false)
  const [sellProduct, setSellProduct] = useState<any>(null)
  const [sellQuantity, setSellQuantity] = useState(1)
  const { toast } = useToast()

  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [categories, setCategories] = useState<ICategory[]>([])
  const [locks, setLocks] = useState<(IStockLocation & { currentStock: number })[]>([])

  const [productToDelete, setProductToDelete] = useState<IProduct | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all")
  const [selectedLockFilter, setSelectedLockFilter] = useState<string>("all")
  const [userData, setUserData] = useState<IUser | null>(null)

  const { data: session, status } = useSession();

  useEffect(() => {
    async function fetchCategories() {
      const categories = await CetegoryService.list()
      setCategories(categories)
    }

    async function fetchLocks() {
      const lockList = await StockLocationService.list();
      const productList = await ProductService.list();
      const locksWithStock = await Promise.all(
        lockList.map(async (lock) => {
          const product = productList.filter((x) => x.stock_location_id == lock._id);
          return {
            ...lock,
            currentStock: product.length
          }
        })
      );

      setProducts(productList);
      setLocks(locksWithStock);
    }

    async function fetchUserData() {
      const users = await UserService.findById((session?.user as any)?.id as string);
      if (!users) {
        return;
      }
      console.log("User Data:", users);
      setUserData(users);
    }

    fetchUserData();
    fetchCategories()
    fetchLocks()
  }, [])

  useEffect(() => {
    fetchProducts((boolean) => {
      setLoading(boolean)
    }, (data) => {
      setProducts(data)
    })
  }, [])

  const filteredProducts = products.filter(
    (product: IProduct) =>
      (product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)) &&
      (selectedCategoryFilter === "all" || !selectedCategoryFilter ? true : categories.some((x => x.name === selectedCategoryFilter))) &&
      (selectedLockFilter === "all" || !selectedLockFilter ? true : locks.some((x) => x.name === selectedLockFilter && x.currentStock > 0))
  )

  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.productManagement}</h1>
          <p className="text-slate-600">{t.manageInventory}</p>
        </div>
        {/* <AddProductDialog
          onClose={() => setIsScannerOpen(false)}
          fetchProducts={() => fetchProducts(setLoading, setProducts)}
          isAddDialogOpen={isScannerOpen}
          setIsAddDialogOpen={setIsScannerOpen}
          categories={categories}
          locks={locks}
        /> */}
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsScannerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.addProduct}
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder={t.searchProducts}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          {/* Filter Dropdown */}
          <Select
            value={selectedCategoryFilter}
            onValueChange={setSelectedCategoryFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.category}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedLockFilter}
            onValueChange={setSelectedLockFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t.storageLock} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.storageLock}</SelectItem>
              {locks.map((lock) => (
                <SelectItem key={lock._id} value={lock.name}>
                  {lock.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="px-3"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="px-3"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <img
            src="/logo.png"
            alt="Loading..."
            className="w-24 h-24 mb-4"
            style={{
              opacity: (Math.sin(Date.now() / 500) + 1) / 2,
              transition: "opacity 0.5s ease-in-out",
            }}
          />
          <span className="text-slate-500 text-lg">{t.loading}</span>
        </div>
      ) : viewMode === "table" ? (
        <ProductTable
          filteredProducts={filteredProducts}
          categories={categories}
          locks={locks}
          setSellProduct={setSellProduct}
          setSellQuantity={setSellQuantity}
          setIsSellDialogOpen={setIsSellDialogOpen}
          setEditingProduct={setEditingProduct}
          setIsEditDialogOpen={setIsEditDialogOpen}
          setProductToDelete={setProductToDelete}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        />
      ) : (
        <ProductCard
          filteredProducts={filteredProducts}
          categories={categories}
          locks={locks}
          setSellProduct={setSellProduct}
          setSellQuantity={setSellQuantity}
          setIsSellDialogOpen={setIsSellDialogOpen}
          setEditingProduct={setEditingProduct}
          setIsEditDialogOpen={setIsEditDialogOpen}
          setProductToDelete={setProductToDelete}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        />
      )}

      <SellProductForm
        isSellDialogOpen={isSellDialogOpen}
        setIsSellDialogOpen={() => setIsSellDialogOpen(false)}
        sellProduct={sellProduct}
        sellQuantity={sellQuantity}
        setSellQuantity={setSellQuantity}
        handleSell={async () => {
          await handleSell(sellProduct, sellQuantity, toast, () => {
            fetchProducts((boolean) => {
              setLoading(boolean)
            }, (data) => {
              setProducts(data)
            })
          })
          setIsSellDialogOpen(false)
        }}
        fetchProducts={fetchProducts}
        setLoading={setLoading}
        setProducts={setProducts}
        setSellProduct={setSellProduct}
        categories={categories}
        locks={locks}
      />

      {/* Edit Product Dialog - New */}
      <EditProductForm
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        categories={categories}
        locks={locks}
        handleEdit={async (product: IProduct) => {
          await handleEdit(product, toast, () => {
            fetchProducts((boolean) => {
              setLoading(boolean)
            }, (data) => {
              setProducts(data)
            })
          }, () => {
            fetchProducts(setLoading, setProducts)
          }, locks)
          setIsEditDialogOpen(false)
        }}
        fetchProducts={fetchProducts}
        setLoading={setLoading}
        setProducts={setProducts}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        mode="add"
        onConfirm={(items) => {
          setIsScannerOpen(false)
          setIsAddDialogOpen(true)

          items.forEach((cart) => {
            //make cart added to update product
            const product = products.find((p) => p.barcode === cart.barcode)
            console.log(cart)
            if (product) {
              ProductService.updateQuantity(product._id as string, cart.cartQuantity, userData as IUser)
            }
          })

          fetchProducts((boolean) => {
            setLoading(boolean)
          }, (data) => {
            setProducts(data)
          })

          toast({
            title: "Products Added",
            description: "Products have been added successfully.",
            variant: "default",
          })
        }}
        fetchProducts={() => fetchProducts(setLoading, setProducts)}
      />
      {/* Delete Product Dialog - New */}
      <DeleteProductForm
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        productToDelete={productToDelete}
        setProductToDelete={(product: IProduct | null) => setProductToDelete(product)}
        handleDelete={async (productToDelete) => {
          await handleDelete(productToDelete, toast, async () => {
            fetchProducts((boolean) => {
              setLoading(boolean)
            }, (data) => {
              setProducts(data)
            })
          }, userData as IUser)
        }}
      />
    </div>
  )
}