import mongoose, { Schema } from "mongoose";

export const SettingsSchema = new Schema({
  lowStockThreshold: { type: Number, default: 10 },
  enableLowStockAlerts: { type: Boolean, default: true },
  enableEmailNotifications: { type: Boolean, default: true },
  enablePushNotifications: { type: Boolean, default: false },
  promptPayPhone: { type: String, default: "00000000000" },
  created_at: { type: Date, default: Date.now }
});

export const Settings = mongoose.models?.Settings || mongoose.model('Settings', SettingsSchema);