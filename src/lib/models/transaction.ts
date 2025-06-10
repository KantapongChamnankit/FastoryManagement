import mongoose, { Schema } from "mongoose";

export const TransactionSchema = new Schema({
  products: [{
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    cost: { type: Number, required: true }
  }],
  total_price: { type: Number, required: true },
  total_cost: { type: Number, required: true },
  profit: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  user_id: { type: Schema.Types.ObjectId, ref: "User" }
});

export const Transaction = mongoose.models?.Transaction || mongoose.model('Transaction', TransactionSchema);