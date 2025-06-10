import mongoose, { Schema } from "mongoose";

export const ImageSchema = new Schema({
  url: { type: String, required: true },
  uploaded_at: { type: Date, default: Date.now }
});

export const Image = mongoose.models?.Image || mongoose.model('Image', ImageSchema);