import mongoose, { Schema } from "mongoose";

export const ProductSchema = new Schema({
  barcode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category_id: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  stock_location_id: { type: Schema.Types.ObjectId, ref: "StockLocation", required: true },
  quantity: { type: Number, required: true },
  cost: { type: Number, required: true },
  price: { type: Number, required: true },
  image_id: { type: Schema.Types.ObjectId, ref: "Image" }
}, { timestamps: true });

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);