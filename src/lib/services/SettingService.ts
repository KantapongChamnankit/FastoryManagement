"use server"

import mongoose from "mongoose";
import { ISettings } from "../interface/ISetting";
import { Settings } from "../models/settings";
import { autoSerialize } from "../utils";
import { User } from "../models/user";
import bcrypt from "bcryptjs";
import { Role } from "../models/role";
import { ROLE_PERMISSIONS } from "../permissions";


export async function getSettings() {
    const doc = await Settings.findOne();
    if (!doc) {
        const created = await Settings.create({});
        return autoSerialize(created) as ISettings;
    }
    // Backfill missing field on old documents
    if (typeof (doc as any).promptPayPhone === 'undefined') {
        (doc as any).promptPayPhone = "00000000000";
        await doc.save();
    }
    return autoSerialize(doc) as ISettings;
}

export async function updateSettings(updatedSettings: ISettings) {
    let settingsDoc = await Settings.findOne();
    if (!settingsDoc) {
        settingsDoc = await Settings.create({ ...updatedSettings });
    } else {
        Object.assign(settingsDoc, updatedSettings);
        await settingsDoc.save();
    }
    return autoSerialize(settingsDoc) as ISettings;
}

export async function resetSettings() {
    const defaults = {
        lowStockThreshold: 10,
        enableLowStockAlerts: true,
        enableEmailNotifications: true,
        enablePushNotifications: false,
        promptPayPhone: "00000000000"
    };
    await Settings.updateMany({}, { $set: defaults });
    const existing = await Settings.findOne();
    if (existing) return autoSerialize(existing);
    const created = await Settings.create(defaults);
    return autoSerialize(created);
}

export async function createSettings(settings: ISettings) {
    const newSettings = new Settings({ ...settings });
    await newSettings.save();
    return autoSerialize(newSettings);
}

export async function dropDB() {
    await mongoose.connection.dropDatabase();
    const adminRole = new Role({
        name: 'admin',
        permissions: new Map([
            ['products', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('products:'))],
            ['sales', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('sales:'))],
            ['users', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('users:'))],
            ['categories', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('categories:'))],
            ['storage', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('storage:'))],
            ['reports', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('reports:'))],
            ['settings', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('settings:'))],
            ['dashboard', ROLE_PERMISSIONS.admin.filter(p => p.startsWith('dashboard:'))],
        ])
    });

    // Create Staff role
    const staffRole = new Role({
        name: 'staff',
        permissions: new Map([
            ['products', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('products:'))],
            ['sales', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('sales:'))],
            ['categories', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('categories:'))],
            ['storage', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('storage:'))],
            ['settings', ROLE_PERMISSIONS.staff.filter(p => p.startsWith('settings:'))],
        ])
    });

    // Save roles
    await adminRole.save();
    await staffRole.save();
    const admin = await User.create({
        first_name: "สมหญิง",
        last_name: "ขยัน",
        email: "admin@example.com",
        password_hash: bcrypt.hashSync("admin123", 10),
        role_id: adminRole._id,
        status: "active",
        image_id: "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
    });
    return true;
}