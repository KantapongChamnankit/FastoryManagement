import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  const { db } = await connectToDatabase()
  // Fetch the 20 most recent activities, sorted by time descending
  const activities = await db.collection("activities").find({})
    .sort({ time: -1 })
    .limit(20)
    .toArray()
  // Format for frontend
  return NextResponse.json(
    activities.map(activity => ({
      ...activity,
      id: activity._id?.toString(),
      _id: undefined,
      time: activity.time || activity.createdAt || "",
    }))
  )
}