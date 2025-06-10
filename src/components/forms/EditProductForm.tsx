import { ICategory, IProduct, IStockLocation } from "@/lib"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Button } from "../ui/button"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { useToast } from "@/hooks/use-toast"

interface props {
    isEditDialogOpen: boolean;
    setIsEditDialogOpen: (open: boolean) => void;
    editingProduct: IProduct | null;
    setEditingProduct: React.Dispatch<React.SetStateAction<IProduct | null>>;
    categories: ICategory[];
    locks: (IStockLocation & { currentStock: number })[];
    handleEdit: (
        updatedProduct: IProduct,
        originalProduct: IProduct,
        toast: any,
        refreshProducts: () => void,
        locks: any[]
    ) => Promise<void>;
    fetchProducts: (setLoading: (loading: boolean) => void, setProducts: (data: IProduct[]) => void) => void;
    setLoading: (loading: boolean) => void;
    setProducts: (data: IProduct[]) => void;
}

export function EditProductForm({
    isEditDialogOpen,
    setIsEditDialogOpen,
    editingProduct,
    setEditingProduct,
    categories,
    locks,
    handleEdit,
    fetchProducts,
    setLoading,
    setProducts
}: props) {
    const language = useLanguage()
    const t = translations[language.lang]
    const { toast } = useToast()

    return (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-3xl w-full">
                <DialogHeader>
                    <DialogTitle>
                        <span className="font-semibold">{t.editProduct}</span>
                        {editingProduct ? (
                            <span className="block text-base text-slate-500 mt-1">{editingProduct.name}</span>
                        ) : null}
                    </DialogTitle>
                </DialogHeader>
                {editingProduct && (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault()
                            const formData = new FormData(e.target as HTMLFormElement)
                            const updatedProduct: IProduct = {
                                barcode: formData.get("barcode") as string,
                                name: formData.get("name") as string,
                                category_id: editingProduct.category_id,
                                stock_location_id: editingProduct.stock_location_id,
                                quantity: Number(formData.get("quantity")) || 0,
                                cost: Number(formData.get("lotCost")) || 0,
                                price: Number(formData.get("unitPrice")) || 0
                            }
                            await handleEdit({ _id: editingProduct._id, ...updatedProduct }, editingProduct, toast, () => {
                                fetchProducts((boolean) => {
                                    setLoading(boolean)
                                }, (data) => {
                                    setProducts(data)
                                })
                            }, locks)
                            setIsEditDialogOpen(false)
                        }}
                        className="space-y-6"
                    >
                        {/* Product Info Section */}
                        <div>
                            <h3 className="font-semibold mb-2 text-slate-700">{t.productInformation}</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="barcode">{t.barcode}</Label>
                                    <Input
                                        id="barcode"
                                        name="barcode"
                                        placeholder={t.enterBarcode}
                                        defaultValue={editingProduct.barcode}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t.productName}</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder={t.enterProductName}
                                        defaultValue={editingProduct.name}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Category & Lock Section */}
                        <div>
                            <h3 className="font-semibold mb-2 text-slate-700">{t.categoryStorage}</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category">{t.category}</Label>
                                    <Select
                                        value={categories.find((cat) => cat._id === editingProduct.category_id)?.name || ""}
                                        onValueChange={(value) => {
                                            const selectedCategory = categories.find((cat) => cat.name === value)
                                            if (selectedCategory && selectedCategory._id) {
                                                setEditingProduct((prev: IProduct | null) => prev ? { ...prev, category_id: selectedCategory._id as string } : prev)
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t.selectCategory} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat._id} value={cat.name}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lock">{t.storageLock}</Label>
                                    <Select
                                        value={locks.find((lock) => lock._id === editingProduct.stock_location_id)?.name || ""}
                                        onValueChange={(value) => {
                                            const selectedLock = locks.find((lock) => lock.name === value)
                                            setEditingProduct((prev) => prev ? { ...prev, stock_location_id: selectedLock?._id as string } : prev)
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t.selectStorageLock} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locks.map((lock) => (
                                                <SelectItem key={lock._id} value={lock.name}>
                                                    {lock.name} (Capacity: {lock.capacity})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-200 my-2"></div>

                        {/* Quantity, Cost, Price Section */}
                        <div>
                            <h3 className="font-semibold mb-2 text-slate-700">{t.stockPricing}</h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">{t.quantity}</Label>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        placeholder="0"
                                        defaultValue={editingProduct.quantity}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lotCost">{t.lotCost}</Label>
                                    <Input
                                        id="lotCost"
                                        name="lotCost"
                                        type="number"
                                        placeholder="0.00"
                                        defaultValue={editingProduct.cost}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unitPrice">{t.unitPrice}</Label>
                                    <Input
                                        id="unitPrice"
                                        name="unitPrice"
                                        type="number"
                                        placeholder="0.00"
                                        defaultValue={editingProduct.price}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">
                                {t.cancel}
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                {t.saveChanges}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}