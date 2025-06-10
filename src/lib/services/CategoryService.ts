"use server"

import { Category, ICategory, IUser } from "@/lib/index";
import { autoSerialize } from "../utils";
import * as ActivityService from "./ActivityService";

export async function create(name: string, description: string) {
  return autoSerialize(await new Category({ name, description }).save());
}

export async function list() {
  return autoSerialize(await Category.find()) as ICategory[];
}

export async function remove(categoryId: string, user: IUser) {
  if (!categoryId) {
    throw new Error("Category ID is required");
  }
  const category = await Category.findById(categoryId) as ICategory;
  if (!category) {
    throw new Error("Category not found");
  }
  
  ActivityService.log(
    user._id as string,
    "remove",
    `ลบหมวดหมู่ ${category.name}`
  )
  return autoSerialize(await Category.findByIdAndDelete(categoryId))
}

export async function update(categoryId: string, name: string, description: string) {
  return autoSerialize(
    await Category.findByIdAndUpdate(
      categoryId,
      { name, description },
      { new: true }
    )
  ) as ICategory;
}