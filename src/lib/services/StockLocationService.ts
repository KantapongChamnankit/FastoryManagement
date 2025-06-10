"use server"

import { IStockLocation, StockLocation } from "@/lib/index";
import { autoSerialize } from "../utils";

export async function create(name: string, position: string, capacity: number) {
  return autoSerialize(await new StockLocation({ name, position, capacity }).save())
}

export async function list() {
  return autoSerialize(await StockLocation.find()) as IStockLocation[];
}

export async function get(id: string) {
  return autoSerialize(await StockLocation.findById(id)) as IStockLocation | null;
}

export async function update(id: string, name: string, position: string, capacity: number) {
  return autoSerialize(
    await StockLocation.findByIdAndUpdate(
      id,
      { name, position, capacity },
      { new: true }
    )
  ) as IStockLocation | null;
}

export async function remove(id: string) {
  return autoSerialize(await StockLocation.findByIdAndDelete(id))
}