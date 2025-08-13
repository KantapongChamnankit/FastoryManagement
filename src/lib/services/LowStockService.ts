"use server"

import { Product } from "@/lib/models/product";
import * as NotificationService from "@/lib/services/NotificationService";
import { DBConnect } from "../utils/DBConnect";
import { autoSerialize } from "../utils";

export interface ILowStockItem {
  _id: string;
  name: string;
  currentStock: number;
  threshold: number;
  category: string;
}

export async function checkLowStock(threshold: number = 10): Promise<ILowStockItem[]> {
  await DBConnect();
  
  const lowStockProducts = await Product.find({
    quantity: { $lte: threshold }
  }).populate('category_id', 'name');

  return autoSerialize(lowStockProducts.map(product => ({
    _id: product._id.toString(),
    name: product.name,
    currentStock: product.quantity,
    threshold,
    category: product.category_id?.name || 'Uncategorized'
  })));
}

export async function sendLowStockNotifications(
  userId: string, 
  threshold: number = 10
): Promise<{ sent: number; notifications: any[] }> {
  try {
    const lowStockItems = await checkLowStock(threshold);
    
    if (lowStockItems.length === 0) {
      return { sent: 0, notifications: [] };
    }

    // Check if we've already sent notifications for these items recently (within 24 hours)
    const recentNotifications = await NotificationService.getNotificationsByUserId(userId, {
      limit: 50
    });

    const recentLowStockNotifications = recentNotifications.filter(notification => 
      notification.category === 'inventory' &&
      notification.type === 'warning' &&
      notification.title.includes('Low Stock') &&
      new Date(notification.createdAt!).getTime() > Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    );

    const notificationsToSend = [];
    
    for (const item of lowStockItems) {
      // Check if we already sent a notification for this product recently
      const alreadyNotified = recentLowStockNotifications.some(notification =>
        notification.message.includes(item.name)
      );

      if (!alreadyNotified) {
        notificationsToSend.push({
          userId,
          title: 'Low Stock Alert',
          message: `Product "${item.name}" is running low (${item.currentStock} items remaining)`,
          type: 'warning' as const,
          category: 'inventory' as const,
          actionUrl: '/home/products',
          metadata: {
            productId: item._id,
            productName: item.name,
            currentStock: item.currentStock,
            threshold,
            category: item.category
          }
        });
      }
    }

    let sentNotifications: any[] = [];
    if (notificationsToSend.length > 0) {
      sentNotifications = await NotificationService.createBulkNotifications(notificationsToSend);
    }

    return {
      sent: sentNotifications.length,
      notifications: sentNotifications
    };

  } catch (error) {
    console.error('Error sending low stock notifications:', error);
    throw error;
  }
}

export async function sendCriticalLowStockNotification(
  userId: string,
  productName: string,
  currentStock: number,
  threshold: number
) {
  return await NotificationService.createNotification({
    userId,
    title: 'Critical Stock Alert',
    message: `URGENT: Product "${productName}" is critically low (${currentStock} items remaining)`,
    type: 'error',
    category: 'inventory',
    actionUrl: '/home/products',
    metadata: {
      productName,
      currentStock,
      threshold,
      critical: true
    }
  });
}

// Function to be called when stock is updated (e.g., after a sale)
export async function checkAndNotifyLowStock(
  userId: string,
  productId: string,
  newStock: number,
  threshold: number
) {
  if (newStock <= threshold) {
    await DBConnect();
    const product = await Product.findById(productId).populate('category_id', 'name');
    
    if (product) {
      // Check if it's critically low (less than half the threshold)
      const isCritical = newStock <= Math.max(1, Math.floor(threshold / 2));
      
      if (isCritical) {
        await sendCriticalLowStockNotification(userId, product.name, newStock, threshold);
      } else {
        await NotificationService.createNotification({
          userId,
          title: 'Low Stock Alert',
          message: `Product "${product.name}" is running low (${newStock} items remaining)`,
          type: 'warning',
          category: 'inventory',
          actionUrl: '/home/products',
          metadata: {
            productId: product._id.toString(),
            productName: product.name,
            currentStock: newStock,
            threshold,
            category: product.category_id?.name || 'Uncategorized'
          }
        });
      }
    }
  }
}
