"use server"

import { IRole, Role } from "@/lib/index";
import { autoSerialize } from "../utils";
import { DBConnect } from "../utils/DBConnect";

export async function getRolePermissions(role_id: string) {
  DBConnect();
  const role = await Role.findById(role_id);
  return role?.permissions as IRole["permissions"] || {} as IRole["permissions"];
}

export async function can(role_id: string, resource: string, action: string) {
  DBConnect();
  const role = await Role.findById(role_id);
  const perms = role?.permissions?.get(resource);
  return perms?.includes(action) || false;
}

export  async function list() {
  DBConnect();
  return autoSerialize(await Role.find())
}

export async function findById(id: string) {
  DBConnect();
  if (!id) {
    throw new Error("Role ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Role ID");
  }
  const role = await Role.findById(id);
  if (!role) {
    throw new Error("Role not found");
  }
  return autoSerialize(role);
}

export async function create(role: IRole) {
  DBConnect();
  const newRole = await Role.create(role);
  return autoSerialize(newRole);
}

import mongoose from "mongoose";

export async function update(id: string, role: IRole) {
  DBConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Role ID");
  }
  const updatedRole = await Role.findByIdAndUpdate(id, role, {
    new: true,
  });
  if (!updatedRole) {
    throw new Error("Role not found");
  }
  return autoSerialize(updatedRole);
}
export async function remove(id: string) {
  DBConnect();
  const deletedRole = await Role.findByIdAndDelete(id);
  return autoSerialize(deletedRole);
}