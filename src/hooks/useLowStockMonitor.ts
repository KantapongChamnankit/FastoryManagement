"use client"

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import * as LowStockService from '@/lib/services/LowStockService';
import { createSettings, getSettings } from '@/lib/services/SettingService';

// Hook to monitor low stock and send notifications
// Make sure to use this hook only inside React function components or other hooks
export function useLowStockMonitor() {
  const { data: session, status } = useSession();

  const checkLowStock = useCallback(async () => {
    if (status !== 'authenticated' || !(session?.user as any)?.id) {
      return;
    }

    try {
      const settings = await getSettings(); // Client-side settings
      if (!settings) {
        //default
        createSettings({
          lowStockThreshold: 10,
          enableLowStockAlerts: true,
          enableEmailNotifications: true,
          enablePushNotifications: false
        })
        return;
      }

      // Only check if low stock alerts are enabled
      if (!settings.enableLowStockAlerts) {
        return;
      }

      const userId = (session?.user as any)?.id;
      const threshold = settings.lowStockThreshold;

      // Send low stock notifications
      const result = await LowStockService.sendLowStockNotifications(userId, threshold);

      if (result.sent > 0) {
        console.log(`Sent ${result.sent} low stock notifications`);
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === 'authenticated') {
      // Initial check after 5 seconds
      const initialTimer = setTimeout(() => {
        checkLowStock();
      }, 5000);

      // Then check every 30 minutes
      const interval = setInterval(() => {
        checkLowStock();
      }, 30 * 60 * 1000); // 30 minutes

      return () => {
        clearTimeout(initialTimer);
        clearInterval(interval);
      };
    }
  }, [status, checkLowStock]);

  // Return manual check function for immediate use
  return { checkLowStock };
}