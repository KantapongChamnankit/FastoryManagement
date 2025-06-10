"use server"

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI as string;
if (!MONGODB_URI) throw new Error('Please define the MONGO_URI');
let cached = (global as any).mongoose || { conn: null, promise: null };

export async function DBConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'data',
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
