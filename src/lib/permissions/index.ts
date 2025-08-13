// Permission definitions
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Product permissions
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_UPDATE_STOCK: 'products:update_stock', // Staff can only update stock
  
  // Sales permissions
  SALES_CREATE: 'sales:create',
  SALES_VIEW: 'sales:view',
  SALES_VIEW_PROFIT: 'sales:view_profit', // Only admin can view profit
  
  // Category permissions
  CATEGORIES_VIEW: 'categories:view',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  
  // Storage/Locks permissions
  STORAGE_VIEW: 'storage:view',
  STORAGE_CREATE: 'storage:create',
  STORAGE_UPDATE: 'storage:update',
  STORAGE_DELETE: 'storage:delete',
  
  // User management permissions
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Reports permissions
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Settings permissions
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // Notification permissions
  NOTIFICATIONS_VIEW: 'notifications:view',
  NOTIFICATIONS_CREATE: 'notifications:create',
  NOTIFICATIONS_MANAGE: 'notifications:manage',
  NOTIFICATIONS_DELETE: 'notifications:delete',
} as const;

// Role definitions with permissions
export const ROLE_PERMISSIONS = {
  admin: [
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    
    // Products - full access
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCTS_UPDATE_STOCK,
    
    // Sales - full access including profit
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_VIEW_PROFIT,
    
    // Categories - full access
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,
    
    // Storage - full access
    PERMISSIONS.STORAGE_VIEW,
    PERMISSIONS.STORAGE_CREATE,
    PERMISSIONS.STORAGE_UPDATE,
    PERMISSIONS.STORAGE_DELETE,
    
    // Users - full access
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    
    // Reports - full access
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    
    // Settings - full access
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    
    // Notifications - full access for admin
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.NOTIFICATIONS_CREATE,
    PERMISSIONS.NOTIFICATIONS_MANAGE,
    PERMISSIONS.NOTIFICATIONS_DELETE,
  ],
  
  staff: [
    // No dashboard access
    
    // Products - limited access (only stock updates, can view)
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_UPDATE_STOCK,
    
    // Sales - can sell but no profit view
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_VIEW,
    
    // Categories - can manage
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,
    
    // Storage - can manage
    PERMISSIONS.STORAGE_VIEW,
    PERMISSIONS.STORAGE_CREATE,
    PERMISSIONS.STORAGE_UPDATE,
    PERMISSIONS.STORAGE_DELETE,

    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.SETTINGS_VIEW,
    
    // Notifications - can only view their own
    PERMISSIONS.NOTIFICATIONS_VIEW,
    
    // No user management access
    // No reports access
  ],
} as const;

// Helper function to check if user has permission
export const hasPermission = (userRole: string, permission: string): boolean => {
  const roleKey = userRole.toLowerCase() as keyof typeof ROLE_PERMISSIONS;
  const rolePermissions = ROLE_PERMISSIONS[roleKey];
  
  if (!rolePermissions) {
    return false;
  }
  
  return rolePermissions.includes(permission as any);
};

// Helper function to get sidebar items based on user role
export const getFilteredSidebarConfig = (userRole: string) => {
  const role = userRole.toLowerCase();
  
  if (role === 'admin') {
    // Admin sees everything
    return 'all';
  }
  
  if (role === 'staff') {
    // Staff sees limited items
    return [
      'products', // Can view products (with limited actions)
      'sellProduct', // Can sell products
      'categories', // Can manage categories
      'storageLocks', // Can manage storage locations
      'settings' // Can manage settings
    ];
  }
  
  return [];
};

// Helper function to check if user can access a route
export const canAccessRoute = (userRole: string, route: string): boolean => {
  const role = userRole.toLowerCase();
  
  if (role === 'admin') {
    return true; // Admin can access everything
  }
  
  if (role === 'staff') {
    // Staff can only access specific routes
    const allowedRoutes = [
      '/home/products',
      '/home/sell',
      '/home/categories',
      '/home/locks',
      '/home/settings',
    ];
    
    return allowedRoutes.some(allowedRoute => route.startsWith(allowedRoute));
  }
  
  return false;
};
