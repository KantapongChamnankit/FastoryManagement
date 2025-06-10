import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useLanguage } from "@/contexts";
import { translations } from "@/lib/utils/Language";
import { CategoryForm } from "../forms/AddCategoryForm";

interface props {
    fetchCategories: () => Promise<void>;
    isAddDialogOpen: boolean;
    setIsAddDialogOpen: (open: boolean) => void;
}

export function AddCategoryDialog({
    fetchCategories,
    isAddDialogOpen,
    setIsAddDialogOpen
}: props) {
    const language = useLanguage();
    const t = translations[language.lang];
    return (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t.addCategory}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addNewCategory}</DialogTitle>
            </DialogHeader>
            <CategoryForm onClose={() => setIsAddDialogOpen(false)} fetchCategories={fetchCategories} t={t} />
          </DialogContent>
        </Dialog>
    )
}