import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts";
import { translations } from "@/lib/utils/Language";
import { IProduct } from "@/lib";

interface props {
    isDeleteDialogOpen: boolean;
    setIsDeleteDialogOpen: (open: boolean) => void;
    productToDelete: IProduct | null;
    setProductToDelete: (product: IProduct | null) => void;
    handleDelete: (product: IProduct) => Promise<void>; // Function to handle the deletion of the product
}

export function DeleteProductForm({
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    productToDelete,
    setProductToDelete,
    handleDelete, // Function to handle the deletion of the product
}: props) {
    const language = useLanguage();
    const t = translations[language.lang];

    return (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.deleteProduct}</DialogTitle>
                </DialogHeader>
                <div>
                    {t.confirmDelete}{" "}
                    <span className="font-semibold text-red-600">{productToDelete?.name}</span>?
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                        type="button"
                    >
                        {t.cancel}
                    </Button>
                    <Button
                        className="bg-red-600 text-white"
                        onClick={async () => {
                            if (productToDelete) {
                                await handleDelete(productToDelete)
                            }
                            setIsDeleteDialogOpen(false)
                            setProductToDelete(null)
                        }}
                    >
                        {t.delete}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}