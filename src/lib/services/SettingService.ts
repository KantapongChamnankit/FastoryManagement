"use server"

import mongoose from "mongoose";
import { ISettings } from "../interface/ISetting";
import { Settings } from "../models/settings";
import { autoSerialize } from "../utils";
import { User } from "../models/user";
import bcrypt from "bcryptjs";
import { Role } from "../models/role";


export async function getSettings() {
    const settings: ISettings | null = await Settings.findOne();
    return settings ? autoSerialize(settings) as ISettings: null;
}

export async function updateSettings(updatedSettings: ISettings) {
    const settings = await Settings.findOneAndUpdate({}, updatedSettings, { new: true });
    return settings ? autoSerialize(settings) as ISettings : null;
}

export async function resetSettings() {
    const settings = await Settings.findOneAndUpdate({}, {
        lowStockThreshold: 10,
        enableLowStockAlerts: true,
        enableEmailNotifications: true,
        enablePushNotifications: false
    }, { new: true });
    return settings ? autoSerialize(settings) : null;
}

export async function createSettings(settings: ISettings) {
    const newSettings = new Settings(settings);
    await newSettings.save();
    return autoSerialize(newSettings);
}

export async function dropDB() {
    await mongoose.connection.dropDatabase();
    const adminRole = await Role.create({
        name: "admin",
        permissions: {
            products: ["read", "update"],
            reports: ["read"]
        }
    });
    const admin = await User.create({
        first_name: "สมหญิง",
        last_name: "ขยัน",
        email: "admin@example.com",
        password_hash: bcrypt.hashSync("admin123", 10),
        role_id: adminRole._id,
        status: "active",
        notification: []
    });
    return true;
}