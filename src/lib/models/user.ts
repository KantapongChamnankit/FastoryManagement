import mongoose, { Schema } from "mongoose";

export const UserSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: false }, // Make optional for OAuth users
    role_id: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    image_id: { type: String, required: false, default: null },
    // OAuth fields
    auth_provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    google_id: { type: String, required: false, unique: true, sparse: true }
}, { timestamps: true });

// Clear the cached model to ensure schema changes take effect
if (mongoose.models?.User) {
    delete mongoose.models.User;
}

export const User = mongoose.model('User', UserSchema);