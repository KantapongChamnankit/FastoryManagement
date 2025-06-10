"use server"

import { Activity, IActivity } from "@/lib/index";
import { autoSerialize } from "../utils";

export async function log(user_id: string, action: string, details?: string) {
  const activity = new Activity({ user_id, action, details });
  return autoSerialize(await activity.save());
}

export async function getRecent(limit = 2) {
  return autoSerialize(await Activity.find().sort({ created_at: -1 }).limit(limit)) as IActivity[]
}
