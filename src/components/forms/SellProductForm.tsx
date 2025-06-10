import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { AlertDialogHeader } from "../ui/alert-dialog"
import { translations } from "@/lib/utils/Language"
import { useLanguage } from "@/contexts"
import { ICategory, IProduct, IStockLocation } from "@/lib"

interface props {
  isSellDialogOpen: boolean;
  setIsSellDialogOpen: (open: boolean) => void;
  sellProduct: IProduct; // Replace with actual type
  setSellProduct: (product: IProduct) => void; // Replace with actual type
  sellQuantity: number;
  setSellQuantity: (quantity: number) => void;
  handleSell: (product: IProduct, quantity: number, toast: any, refreshProducts: () => void) => Promise<void>; // Replace with actual types
  fetchProducts: (setLoading: (loading: boolean) => void, setProducts: (data: IProduct[]) => void) => void; // Replace with actual types
  setLoading: (loading: boolean) => void;
  setProducts: (data: IProduct[]) => void; // Replace with actual types
  categories: ICategory[]; // Replace with actual type
  locks: (IStockLocation & { currentStock: number })[]; // Replace with actual type
}

export function SellProductForm({
  isSellDialogOpen,
  setIsSellDialogOpen,
  sellProduct,
  setSellProduct,
  sellQuantity,
  setSellQuantity,
  handleSell,
  fetchProducts,
  setLoading,
  setProducts,
  categories,
  locks
}: props) {
  const language = useLanguage()
  const t = translations[language.lang]
  const { toast } = useToast()

  return (
    <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.sellProduct}</DialogTitle>
        </DialogHeader>
        {sellProduct && (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (sellQuantity < 1 || sellQuantity > sellProduct.quantity) {
                toast({ title: t.invalidQuantity, variant: "destructive" })
                return
              }
              await handleSell(sellProduct, sellQuantity, toast, () => {
                fetchProducts((boolean) => {
                  setLoading(boolean)
                }, (data) => {
                  setProducts(data)
                })
              })
              setIsSellDialogOpen(false)
            }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-4 mb-2">
              <img
                src={sellProduct.image_id ? `/api/images/${sellProduct.image_id}` : "/placeholder.svg"}
                alt={sellProduct.name}
                className="w-16 h-16 object-contain rounded border border-slate-200 bg-white"
              />
              <div>
                <h3 className="font-semibold text-slate-800">{sellProduct.name}</h3>
                <div className="text-xs text-slate-500">
                  <span>{t.barcode}: {sellProduct.barcode}</span>
                  <span className="ml-3">{t.category}: {categories.find((cate) => cate._id === sellProduct.category_id)?.name}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {t.available}: <span className="font-medium">{sellProduct.quantity}</span>
                </div>
              </div>
            </div>
            {/* Quantity input above */}
            <div>
              <Label htmlFor="sellQuantity">{t.quantityToSell}</Label>
              <Input
                id="sellQuantity"
                type="number"
                min={1}
                max={sellProduct.quantity}
                value={sellQuantity}
                onChange={(e) => setSellQuantity(Number(e.target.value))}
                className="w-full"
                required
              />
              <div className="text-xs text-slate-400 mt-1">
                {t.max}: {sellProduct.quantity}
              </div>
            </div>
            {/* Unit price and total on the same line */}
            <div className="flex gap-6 w-full">
              <div className="bg-slate-50 rounded-lg p-4 flex flex-col items-start min-w-[120px] flex-1">
                <Label className="text-xs text-slate-500 mb-1">{t.unitPrice}</Label>
                <div className="font-semibold text-slate-800 text-lg">${sellProduct.price}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-start min-w-[120px] flex-1">
                <Label className="text-xs text-blue-700 mb-1">{t.total}</Label>
                <div className="font-bold text-blue-700 text-lg">
                  ${((sellQuantity || 0) * (sellProduct.price || 0)).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 w-full">
              <Button variant="outline" onClick={() => setIsSellDialogOpen(false)} type="button">
                {t.cancel}
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white"
                disabled={sellQuantity < 1 || sellQuantity > sellProduct.quantity}
              >
                {t.sell}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}