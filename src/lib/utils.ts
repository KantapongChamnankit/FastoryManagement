import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function autoSerialize(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => autoSerialize(item));
  }

  const plain = data.toObject?.() || data;

  return Object.fromEntries(
    Object.entries(plain).map(([key, value]) => {
      if (value && typeof value === "object") {
        if (value instanceof Date) {
          return [key, value.getTime()]; // Convert Date to timestamp (number)
        }

        if (typeof value.toString === "function" && (value as any)._bsontype === "ObjectId") {
          return [key, value.toString()];
        }

        return [key, autoSerialize(value)];
      }

      return [key, value];
    })
  );
}
