import mongoose, { Schema } from "mongoose";

export const UserSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role_id: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

export const User = mongoose.models?.User || mongoose.model('User', UserSchema);