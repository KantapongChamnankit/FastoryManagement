"use server"

import { IRole, Role } from "@/lib/index";
import { autoSerialize } from "../utils";

export async function getRolePermissions(role_id: string) {
  const role = await Role.findById(role_id);
  return role?.permissions as IRole["permissions"] || {} as IRole["permissions"];
}

export async function can(role_id: string, resource: string, action: string) {
  const role = await Role.findById(role_id);
  const perms = role?.permissions?.get(resource);
  return perms?.includes(action) || false;
}

export  async function list() {
  return autoSerialize(await Role.find())
}

export async function findById(id: string) {
  return autoSerialize(await Role.findById(id));
}

export async function create(role: IRole) {
  const newRole = await Role.create(role);
  return autoSerialize(newRole);
}

export async function update(id: string, role: IRole) {
  const updatedRole = await Role.findByIdAndUpdate(id, role, {
    new: true,
  });
  return autoSerialize(updatedRole);
}
export async function remove(id: string) {
  const deletedRole = await Role.findByIdAndDelete(id);
  return autoSerialize(deletedRole);
}