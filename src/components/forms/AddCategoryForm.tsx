'use client'

import { useState } from "react";
import { useToast } from "../ui/use-toast";
import * as CategoryService from "@/lib/services/CategoryService";
import { ICategory } from "@/lib";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface props {
    category?: ICategory;
    onClose: () => void;
    fetchCategories: () => Promise<void>;
    t: {
        addCategory: string;
        addNewCategory: string;
        editCategory: string;
        update: string;
        create: string;
        categoryName: string;
        description: string;
        save: string;
        cancel: string;
        error: string;
    };
}

export function CategoryForm({ category, onClose, fetchCategories, t }: props) {
    const { toast } = useToast()
    const [name, setName] = useState(category?.name || "")
    const [description, setDescription] = useState(category?.description || "")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (category) {
            // Edit
            await CategoryService.update(category._id as string, name, description)
                .then((res) => {
                    toast({ title: t.editCategory, description: t.editCategory + " " + t.save })
                    fetchCategories()
                    onClose()
                })
                .catch((e) => {
                    toast({ title: t.error, description: t.editCategory + " " + t.error, variant: "destructive" })
                })
        } else {
            // Create
            await CategoryService.create(name, description)
                .then((res) => {
                    toast({ title: t.addCategory, description: t.addNewCategory + " " + t.save })
                    fetchCategories()
                    onClose()
                })
                .catch((e) => {
                    toast({ title: t.error, description: t.addNewCategory + " " + t.error, variant: "destructive" })
                })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">{t.categoryName}</Label>
                <Input id="name" placeholder={t.categoryName} value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">{t.description}</Label>
                <Input id="description" placeholder={t.description} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    {t.cancel}
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {category ? t.update : t.create} {t.categoryName}
                </Button>
            </div>
        </form>
    )
}
