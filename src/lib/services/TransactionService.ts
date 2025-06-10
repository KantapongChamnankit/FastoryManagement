"use server"

import { Transaction, ITransaction, IProduct } from "@/lib/index";
import { autoSerialize } from "../utils";
import { DBConnect } from "../utils/DBConnect";

export async function createTransaction(data: ITransaction) {
  await DBConnect();
  return autoSerialize(await new Transaction(data).save())
}

export async function getTodaySummary() {
  await DBConnect();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await Transaction.aggregate([
    {
      $match: {
        created_at: { $gte: today },
      },
    },
    {
      $group: {
        _id: null,
        total_sales: { $sum: "$total_price" },
        total_cost: { $sum: "$total_cost" },
        total_profit: { $sum: "$profit" },
        count: { $sum: 1 },
      },
    },
  ]) as ITransaction[];

  const summary = result[0] || {
    total_sales: 0,
    total_cost: 0,
    total_profit: 0,
    count: 0,
  };


  return autoSerialize(summary) as { total_sales: number; total_cost: number; total_profit: number; count: number;};
}

export async function getRecent(limit = 2) {
  const docs = await Transaction.find().sort({ created_at: -1 }).limit(limit).lean();
  return autoSerialize(docs) as ITransaction[];
}

export async function list() {
  await DBConnect();
  const docs = await Transaction.find().lean();
  return autoSerialize(docs) as ITransaction[];
}

export async function remove(id: string) {
  await DBConnect();
  const result = await Transaction.deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    throw new Error("Transaction not found");
  }
  return { success: true, message: "Transaction deleted successfully" };
}