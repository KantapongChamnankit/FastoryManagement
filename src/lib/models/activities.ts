import mongoose, { Schema } from "mongoose";

export const ActivitySchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  details: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const Activity = mongoose.models?.Activity || mongoose.model('Activity', ActivitySchema);