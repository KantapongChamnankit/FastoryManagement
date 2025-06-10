import mongoose, { Schema } from "mongoose";

export const RoleSchema = new Schema({
    name: { type: String, required: true },
    permissions: {
        type: Map,
        of: [String],
        default: {}
    }
});

export const Role = mongoose.models?.Role || mongoose.model('Role', RoleSchema);