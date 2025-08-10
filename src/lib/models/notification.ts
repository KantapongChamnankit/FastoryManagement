import mongoose, { Schema } from "mongoose";

export const NotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["success", "error", "warning", "info"], required: true },
    read: { type: Boolean, default: false },
    actionUrl: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    category: { type: String, enum: ['system', 'inventory', 'sales', 'user', 'general'], default: 'general' }
}, { timestamps: true });

// Index for better query performance
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.models?.Notification || mongoose.model('Notification', NotificationSchema);
