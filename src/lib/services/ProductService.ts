"use server"

import { IProduct, IUser, Product } from "@/lib/index";
import { DBConnect } from "../utils/DBConnect";
import { autoSerialize } from "../utils";
import * as TransactionService from "./TransactionService";
import * as ActivityService from "./ActivityService";

export async function createProduct(data: IProduct, user: IUser) {
  await DBConnect();
  const product = new Product(data);
  await ActivityService.log(
    user._id as string,
    "add",
    `เพิ่มสินค้า ${data.name}`
  )
  return autoSerialize(await product.save());
}

export async function updateQuantity(productId: string, quantity: number, user: IUser) {
  await DBConnect();
  const product = await Product.findById(productId) as IProduct;
  await ActivityService.log(
    user._id as string,
    "update",
    `เเก้ไขสินค้า ${product.name}`
  )
  return autoSerialize(await Product.findByIdAndUpdate(productId, { $inc: { quantity } }, { new: true }))
}

export async function getLowStock(threshold = 10) {
  await DBConnect();
  return autoSerialize(await Product.find({ quantity: { $lte: threshold } }))
}

export async function findByBarcode(barcode: string) {
  await DBConnect();
  return autoSerialize(await Product.findOne({ barcode })) as IProduct
}

export async function list(filter = {}) {
  await DBConnect();
  return autoSerialize(await Product.find(filter)) as IProduct[];
}

export async function sell(id: string, quantity: number) {
  await DBConnect();
  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found " + id);
  }
  if (product.quantity < quantity) {
    throw new Error("Insufficient stock");
  }
  product.quantity -= quantity;
  await product.save();

  await TransactionService.createTransaction({
    products: [{
      cost: product.cost,
      price: product.price,
      quantity: quantity,
      product_id: product._id as string,
    }],
    profit: (product.price - product.cost) * quantity,
    created_at: Date.now(),
    total_cost: product.cost * quantity,
    total_price: product.price * quantity,
  }).catch((error) => {
    console.error("Error creating transaction:", error);
  })
  return autoSerialize(product);
}

export async function edit(id: string, data: Partial<IProduct>) {
  await DBConnect();
  const product = await Product.findByIdAndUpdate(id, data,
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new Error("Product not found");
  }
  return autoSerialize(product);
}

export async function remove(id: string, user: IUser) {
  await DBConnect();

  const product = await Product.findByIdAndDelete(id);
  await ActivityService.log(
    user._id as string,
    "delete",
    `ลบสินค้า ${product.name}`
  )
  if (!product) {
    throw new Error("Product not found " + id);
  }
  return autoSerialize(product);
}