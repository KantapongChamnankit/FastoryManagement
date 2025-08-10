import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Package, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { ICategory, IStockLocation, IUser } from "@/lib"
import * as ProductService from "@/lib/services/ProductService"
import { signOut, useSession } from "next-auth/react"
import * as UserService from "@/lib/services/UserService"
import { useRouter } from "next/navigation"

interface props {
    onClose: () => void;
    fetchProducts: () => void,
    categories: ICategory[],
    locks: (IStockLocation & { currentStock: number })[],
    barcode: string,
    onAdd: (product: any) => void
}

export function AddProductForm({ onClose, fetchProducts, categories, locks, barcode, onAdd }: props) {
    const { toast } = useToast()

    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [selectedLock, setSelectedLock] = useState<string>("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [user, setUser] = useState<IUser | null>(null)
    const categoryInputRef = useRef<HTMLInputElement>(null)
    const lockInputRef = useRef<HTMLInputElement>(null)
    const { lang } = useLanguage()
    const t = translations[lang]
    const { data: session } = useSession()
    const router = useRouter()

    useEffect(() => {
        async function fetchUser() {
            if (session?.user) {
                const userData = await UserService.findById((session.user as any).id as string)
                if (userData) {
                    setUser(userData)
                }
            }
        }

        fetchUser()
    }, [session])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        setImageFile(file)
        if (file) {
            setImagePreview(URL.createObjectURL(file))
        } else {
            setImagePreview(null)
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0] || null
        setImageFile(file)
        if (file) {
            setImagePreview(URL.createObjectURL(file))
        } else {
            setImagePreview(null)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const handleSubmit = async (formData: FormData) => {
        let imageId = ""
        try {
            const quantity = Number.parseInt(formData.get("quantity") as string)
            const lockName = formData.get("lock") as string
            const selectedLockObj = locks.find((l) => l.name === lockName)
            if (selectedLockObj && quantity > (selectedLockObj.capacity - selectedLockObj.currentStock)) {
                toast({ title: `Quantity exceeds lock capacity (${selectedLockObj.capacity})`, variant: "destructive" })
                return
            }

            if (imageFile) {
                setUploading(true)
                const imageBase64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(imageFile)
                })
                const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        base64: imageBase64,
                        filename: imageFile.name,
                    }),
                })
                const data = await res.json()
                imageId = data.id
                setUploading(false)
            }

            await ProductService.createProduct({
                barcode: barcode,
                name: formData.get("name") as string,
                category_id: categories.find(cat => cat.name === selectedCategory)?._id as string,
                stock_location_id: locks.find(lock => lock.name === selectedLock)?._id as string,
                quantity: 0,
                cost: Number.parseFloat(formData.get("lotCost") as string),
                price: Number.parseFloat(formData.get("unitPrice") as string),
                image_id: imageId,
            }, user as IUser)
                .then((data) => {
                    toast({ title: t.productAdded })
                    onAdd(data)
                    fetchProducts()
                    onClose()
                })
                .catch((error) => {
                    console.error("Error adding product:", error)
                    toast({ title: t.errorAddingProduct, variant: "destructive" })
                    onClose()
                })

        } catch (error) {
            toast({ title: t.errorAddingProduct, variant: "destructive" })
            setUploading(false)
        }
    }

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                await handleSubmit(formData)
            }}
            className="space-y-4"
        >
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t.productName}</Label>
                    <Input id="name" name="name" placeholder={t.enterProductName} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category">{t.category}</Label>
                    <Select
                        value={selectedCategory}
                        onValueChange={(value) => {
                            if (value === "create-categories") {
                                router.push("/home/categories");
                            } else {
                                setSelectedCategory(value);
                                if (categoryInputRef.current) categoryInputRef.current.value = value;
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t.selectCategory} />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.length === 0 ? (
                                <SelectItem
                                    value="create-categories"
                                    onClick={() => {
                                        router.push("/categories");
                                    }}
                                    className="text-blue-600 cursor-pointer"
                                >
                                    Don't have any categories? Create one
                                </SelectItem>
                            ) : (
                                categories.map((cat) => (
                                    <SelectItem key={cat._id} value={cat.name}>
                                        {cat.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <input ref={categoryInputRef} type="hidden" name="category" value={selectedCategory} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lock">{t.storageLock}</Label>
                    <Select
                        value={selectedLock}
                        onValueChange={(value) => {
                            if (value === "create-locks") {
                                router.push("/home/locks");
                            } else {
                                setSelectedLock(value);
                                if (lockInputRef.current) lockInputRef.current.value = value;
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t.selectStorageLock} />
                        </SelectTrigger>
                        <SelectContent>
                            {locks.length === 0 ? (
                                <SelectItem
                                    value="create-locks"
                                    onClick={() => {
                                        router.push("/home/locks");
                                    }}
                                    className="text-blue-600 cursor-pointer"
                                >
                                    Don't have any storage locks? Create one
                                </SelectItem>
                            ) : (
                                locks.map((lock) => (
                                    <SelectItem key={lock._id} value={lock.name}>
                                        {lock.name} (Capacity: {lock.capacity})
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <input ref={lockInputRef} type="hidden" name="lock" value={selectedLock} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="lotCost">{t.lotCost}</Label>
                    <Input id="lotCost" name="lotCost" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unitPrice">{t.unitPrice}</Label>
                    <Input id="unitPrice" name="unitPrice" type="number" placeholder="0.00" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="image">{t.productImage}</Label>
                <div
                    className="border-2 border-dashed border-slate-300 p-6 text-center cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById("product-image-input")?.click()}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="mx-auto mb-2 h-24 object-contain" />
                    ) : (
                        <>
                            <Package className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-600">{t.clickToUpload}</p>
                            <p className="text-xs text-slate-500">{t.imageFormats}</p>
                        </>
                    )}
                    <input
                        id="product-image-input"
                        name="image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />
                </div>
                {uploading && <p className="text-xs text-blue-600">{t.uploadingImage}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose}>
                    {t.cancel}
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={uploading}>
                    {t.addProduct}
                </Button>
            </div>
        </form>
    )
}
