// Example usage of the new Notification system

import * as NotificationService from '@/lib/services/NotificationService';

// Example: Create a notification
export async function createLowStockNotification(userId: string, productName: string, currentStock: number) {
  return await NotificationService.createNotification({
    userId,
    title: 'Low Stock Alert',
    message: `Product "${productName}" is running low (${currentStock} items remaining)`,
    type: 'warning',
    category: 'inventory',
    actionUrl: '/home/products',
    metadata: {
      productName,
      currentStock,
      threshold: 5
    }
  });
}

// Example: Create a sale notification
export async function createSaleNotification(userId: string, saleAmount: number) {
  return await NotificationService.createNotification({
    userId,
    title: 'New Sale',
    message: `New sale completed for $${saleAmount.toFixed(2)}`,
    type: 'success',
    category: 'sales',
    actionUrl: '/home/sell',
    metadata: {
      saleAmount
    }
  });
}

// Example: Send system notification to all users
export async function sendSystemMaintenanceNotification(userIds: string[]) {
  return await NotificationService.sendNotificationToUsers(userIds, {
    title: 'System Maintenance',
    message: 'System maintenance completed successfully',
    type: 'info',
    category: 'system'
  });
}

// Example: Get user notifications with pagination
export async function getUserNotifications(userId: string, page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  
  return await NotificationService.getNotificationsByUserId(userId, {
    limit,
    skip
  });
}

// Example: Get only unread notifications
export async function getUnreadNotifications(userId: string) {
  return await NotificationService.getNotificationsByUserId(userId, {
    unreadOnly: true,
    limit: 20
  });
}
