"use server"

import { INotification } from "@/lib/interface/INofication";
import { Notification } from "@/lib/models/notification";
import { autoSerialize } from "../utils";
import { DBConnect } from "../utils/DBConnect";
import mongoose from "mongoose";

export async function removeNotification(notificationId: string) {
  await DBConnect();
  const result = await Notification.findByIdAndDelete(notificationId);

  if (!result) {
    throw new Error("Notification not found");
  }

  return {
    success: true,
    message: "Notification deleted successfully"
  };
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category?: 'system' | 'inventory' | 'sales' | 'user' | 'general';
  actionUrl?: string;
  metadata?: any;
}) {
  await DBConnect();
  // Convert string userId to ObjectId for saving
  const notificationData = {
    ...data,
    userId: new mongoose.Types.ObjectId(data.userId)
  };
  const notification = new Notification(notificationData);
  return autoSerialize(await notification.save()) as INotification;
}

export async function getNotificationsByUserId(userId: string, options?: {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
}) {
  await DBConnect();
  
  // Convert string userId to ObjectId for query
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  let query = Notification.find({ userId: userObjectId });
  
  if (options?.unreadOnly) {
    query = query.where({ read: false });
  }
  
  // Sort by newest first
  query = query.sort({ createdAt: -1 });
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.skip) {
    query = query.skip(options.skip);
  }
  
  return autoSerialize(await query.exec()) as INotification[];
}

export async function getUnreadCount(userId: string) {
  await DBConnect();
  // Convert string userId to ObjectId for query
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return await Notification.countDocuments({ userId: userObjectId, read: false });
}

export async function markNotificationAsRead(notificationId: string) {
  await DBConnect();
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
  
  if (!notification) {
    throw new Error("Notification not found");
  }
  
  return autoSerialize(notification) as INotification;
}

export async function markAllNotificationsAsRead(userId: string) {
  await DBConnect();
  // Convert string userId to ObjectId for query
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const result = await Notification.updateMany(
    { userId: userObjectId, read: false },
    { read: true }
  );
  
  return {
    success: true,
    message: `Marked ${result.modifiedCount} notifications as read`,
    modifiedCount: result.modifiedCount
  };
}

export async function deleteNotification(notificationId: string) {
  await DBConnect();
  const result = await Notification.findByIdAndDelete(notificationId);
  
  if (!result) {
    throw new Error("Notification not found");
  }
  
  return {
    success: true,
    message: "Notification deleted successfully"
  };
}

export async function deleteAllNotifications(userId: string) {
  await DBConnect();
  // Convert string userId to ObjectId for query
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const result = await Notification.deleteMany({ userId: userObjectId });
  
  return {
    success: true,
    message: `Deleted ${result.deletedCount} notifications`,
    deletedCount: result.deletedCount
  };
}

export async function getNotificationStats(userId: string) {
  await DBConnect();
  
  // Convert string userId to ObjectId for aggregation
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  const stats = await Notification.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: { $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ["$read", true] }, 1, 0] } },
        byType: {
          $push: {
            type: "$type",
            read: "$read"
          }
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total: 0,
      unread: 0,
      read: 0,
      byType: {}
    };
  }
  
  const result = stats[0];
  const typeStats: any = {};
  
  result.byType.forEach((item: any) => {
    if (!typeStats[item.type]) {
      typeStats[item.type] = { total: 0, read: 0, unread: 0 };
    }
    typeStats[item.type].total++;
    if (item.read) {
      typeStats[item.type].read++;
    } else {
      typeStats[item.type].unread++;
    }
  });
  
  return {
    total: result.total,
    unread: result.unread,
    read: result.read,
    byType: typeStats
  };
}

// Bulk operations
export async function createBulkNotifications(notifications: Array<{
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category?: 'system' | 'inventory' | 'sales' | 'user' | 'general';
  actionUrl?: string;
  metadata?: any;
}>) {
  await DBConnect();
  // Convert string userIds to ObjectIds for bulk insertion
  const notificationsWithObjectIds = notifications.map(notification => ({
    ...notification,
    userId: new mongoose.Types.ObjectId(notification.userId)
  }));
  const result = await Notification.insertMany(notificationsWithObjectIds);
  return autoSerialize(result) as INotification[];
}

// Send notification to multiple users
export async function sendNotificationToUsers(
  userIds: string[],
  notificationData: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    category?: 'system' | 'inventory' | 'sales' | 'user' | 'general';
    actionUrl?: string;
    metadata?: any;
  }
) {
  const notifications = userIds.map(userId => ({
    userId,
    ...notificationData
  }));
  
  return await createBulkNotifications(notifications);
}

// Get all notifications (for admin)
export async function getAllNotifications(options?: {
  limit?: number;
  skip?: number;
  userId?: string;
  type?: string;
  category?: string;
  unreadOnly?: boolean;
}) {
  await DBConnect();
  
  let query = Notification.find();
  
  if (options?.userId) {
    // Convert string userId to ObjectId for query
    const userObjectId = new mongoose.Types.ObjectId(options.userId);
    query = query.where({ userId: userObjectId });
  }
  
  if (options?.type) {
    query = query.where({ type: options.type });
  }
  
  if (options?.category) {
    query = query.where({ category: options.category });
  }
  
  if (options?.unreadOnly) {
    query = query.where({ read: false });
  }
  
  // Sort by newest first
  query = query.sort({ createdAt: -1 });
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.skip) {
    query = query.skip(options.skip);
  }
  
  return autoSerialize(await query.exec()) as INotification[];
}

// Get notification statistics for all users
export async function getAllNotificationStats() {
  await DBConnect();
  
  const stats = await Notification.aggregate([
    {
      $group: {
        _id: "$userId",
        total: { $sum: 1 },
        unread: { $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ["$read", true] }, 1, 0] } },
        byType: {
          $push: {
            type: "$type",
            read: "$read"
          }
        }
      }
    }
  ]);
  
  const result: { [userId: string]: any } = {};
  
  stats.forEach((stat) => {
    const typeStats: any = {};
    
    stat.byType.forEach((item: any) => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = { total: 0, read: 0, unread: 0 };
      }
      typeStats[item.type].total++;
      if (item.read) {
        typeStats[item.type].read++;
      } else {
        typeStats[item.type].unread++;
      }
    });
    
    result[stat._id] = {
      total: stat.total,
      unread: stat.unread,
      read: stat.read,
      byType: typeStats
    };
  });
  
  return result;
}

// Delete multiple notifications
export async function deleteMultipleNotifications(notificationIds: string[]) {
  await DBConnect();
  const result = await Notification.deleteMany({ _id: { $in: notificationIds } });
  
  return {
    success: true,
    message: `Deleted ${result.deletedCount} notifications`,
    deletedCount: result.deletedCount
  };
}

// Mark multiple notifications as read
export async function markMultipleNotificationsAsRead(notificationIds: string[]) {
  await DBConnect();
  const result = await Notification.updateMany(
    { _id: { $in: notificationIds } },
    { read: true }
  );
  
  return {
    success: true,
    message: `Marked ${result.modifiedCount} notifications as read`,
    modifiedCount: result.modifiedCount
  };
}
