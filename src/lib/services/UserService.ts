"use server"

import { IUser, User } from "@/lib/index";
import bcrypt from "bcryptjs";
import { autoSerialize } from "../utils";
import { DBConnect } from "../utils/DBConnect";

export async function createUser(data: {
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  role_id: string,
  image_id?: string
}) {
  await DBConnect()
  const password_hash = await bcrypt.hash(data.password, 10);
  const user = new User({ ...data, password_hash });
  return autoSerialize(await user.save())
}

export async function findByEmail(email: string) {
  await DBConnect()
  return autoSerialize(await User.findOne({ email })) as IUser;
}

export async function findById(id: string) {
  await DBConnect()
  return autoSerialize(await User.findById(id).lean()) as IUser
}

export async function checkPassword(user: any, password: string) {
  await DBConnect()
  return await bcrypt.compare(password, user.password_hash);
}

export async function list() {
  await DBConnect()
  return autoSerialize(await User.find()) as IUser[];
}

export async function updateUser(id: string, data: Partial<IUser>) {
  await DBConnect()
  const user = await User.findById(id);
  if (!user) throw new Error("User not found");
  Object.assign(user, data);
  return autoSerialize(await user.save()) as IUser;
}

export async function removeUser(id: string) {
  await DBConnect()
  const result = await User.deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    throw new Error("User not found");
  }
  return { success: true, message: "User deleted successfully" };
}


