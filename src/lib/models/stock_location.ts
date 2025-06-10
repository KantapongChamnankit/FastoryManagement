import mongoose, { Schema } from "mongoose";

export const StockLocationSchema = new Schema({
  name: { type: String, required: true },
  position: { type: String },
  capacity: { type: Number, required: true }
});

export const StockLocation = mongoose.models?.StockLocation || mongoose.model('StockLocation', StockLocationSchema);