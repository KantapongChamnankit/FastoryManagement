export interface INotification {
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  actionUrl?: string;
  metadata?: any;
  createdAt?: string | number;
  updatedAt?: string | number;
  category?: 'system' | 'inventory' | 'sales' | 'user' | 'general';
}
