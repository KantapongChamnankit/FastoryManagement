import { DBConnect } from '@/lib/utils/DBConnect';
import mongoose, { Schema } from 'mongoose';
import dotenv from 'dotenv';
import { Role } from '@/lib/models/role';
import { User } from '@/lib/models/user';
import { Category } from '@/lib/models/category';
import { StockLocation } from '@/lib/models/stock_location';
import { Image } from '@/lib/models/image';
import { Product } from '@/lib/models/product';
import { Transaction } from '@/lib/models/transaction';
import { Activity } from '@/lib/models/activities';
import bcrypt from 'bcrypt';
import { IRole } from '../interface/IRole';

dotenv.config();

const RoleSchema = new Schema({
  name: String,
  permissions: { type: Map, of: [String], default: {} }
});

const UserSchema = new Schema({
  first_name: String,
  last_name: String,
  email: String,
  password_hash: String,
  role_id: { type: Schema.Types.ObjectId, ref: 'Role' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

async function seed() {
  await DBConnect();
  await mongoose.connection.dropDatabase();

  const staffRole = await Role.create({
    name: "staff",
    permissions: {
      products: ["read", "update"],
      reports: ["read"]
    }
  });

  const adminRole = await Role.create({
    name: "admin",
    permissions: {
      users: ["create", "read", "update", "delete"],
      products: ["create", "read", "update", "delete"],
      categories: ["create", "read", "update", "delete"],
      stock_locations: ["create", "read", "update", "delete"],
      transactions: ["read"],
      reports: ["read"]
    }
  });

  const viewerRole = await Role.create({
    name: "viewer",
    permissions: {
      products: ["read"],
      categories: ["read"],
      stock_locations: ["read"],
      transactions: ["read"],
      reports: ["read"]
    }
  });

  // const user = await User.create({
  //   first_name: "สมชาย",
  //   last_name: "ใจดี",
  //   email: "admin@example.com",
  //   password_hash: bcrypt.hashSync("admin123", 10),
  //   role_id: adminRole._id,
  //   status: "active"
  // });

  const staff = await User.create({
    first_name: "สมหญิง",
    last_name: "ขยัน",
    email: "staff@example.com",
    password_hash: bcrypt.hashSync("staff123", 10),
    role_id: staffRole._id,
    status: "active"
  });

  // const category = await Category.create({
  //   name: "เครื่องดื่ม",
  //   description: "รวมสินค้าประเภทเครื่องดื่ม"
  // });

  // const snackCategory = await Category.create({
  //   name: "ขนม",
  //   description: "รวมสินค้าประเภทขนม"
  // });

  // const location = await StockLocation.create({
  //   name: "A1",
  //   position: "ชั้น 1, ซ้ายมือ",
  //   capacity: 200
  // });

  // const location2 = await StockLocation.create({
  //   name: "B2",
  //   position: "ชั้น 2, ขวามือ",
  //   capacity: 150
  // });

  // const image = await Image.create({
  //   url: "https://placehold.co/100x100"
  // });

  // const image2 = await Image.create({
  //   url: "https://placehold.co/100x100/FF0000/FFFFFF?text=Snack"
  // });

  // const product1 = await Product.create({
  //   barcode: "1234567890",
  //   name: "น้ำดื่ม 500ml",
  //   category_id: category._id,
  //   stock_location_id: location._id,
  //   quantity: 50,
  //   cost: 5,
  //   price: 10,
  //   image_id: image._id
  // });

  // const product2 = await Product.create({
  //   barcode: "9876543210",
  //   name: "ขนมปังอบกรอบ",
  //   category_id: snackCategory._id,
  //   stock_location_id: location2._id,
  //   quantity: 100,
  //   cost: 8,
  //   price: 15,
  //   image_id: image2._id
  // });

  // const product3 = await Product.create({
  //   barcode: "1122334455",
  //   name: "น้ำผลไม้กล่อง",
  //   category_id: category._id,
  //   stock_location_id: location._id,
  //   quantity: 30,
  //   cost: 12,
  //   price: 20,
  //   image_id: image._id
  // });

  // await Transaction.create({
  //   products: [{
  //     product_id: product1._id,
  //     quantity: 2,
  //     price: 10,
  //     cost: 5
  //   }],
  //   total_price: 20,
  //   total_cost: 10,
  //   profit: 10,
  //   user_id: user._id
  // });

  // await Transaction.create({
  //   products: [{
  //     product_id: product2._id,
  //     quantity: 3,
  //     price: 15,
  //     cost: 8
  //   }],
  //   total_price: 45,
  //   total_cost: 24,
  //   profit: 21,
  //   user_id: staff._id
  // });

  // await Transaction.create({
  //   products: [{
  //     product_id: product3._id,
  //     quantity: 1,
  //     price: 20,
  //     cost: 12
  //   }],
  //   total_price: 20,
  //   total_cost: 12,
  //   profit: 8,
  //   user_id: user._id
  // });

  // await Activity.create({
  //   user_id: user._id,
  //   action: "create",
  //   details: "เพิ่มสินค้าน้ำดื่ม 500ml"
  // });

  // await Activity.create({
  //   user_id: staff._id,
  //   action: "create",
  //   details: "เพิ่มสินค้าขนมปังอบกรอบ"
  // });

  // await Activity.create({
  //   user_id: user._id,
  //   action: "update",
  //   details: "อัปเดตสต็อกน้ำผลไม้กล่อง"
  // });

  console.log('✅ Seed data created');
  mongoose.connection.close();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.connection.close();
});
