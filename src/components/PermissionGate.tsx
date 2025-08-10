"use client";

import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGateProps {
  permission?: string;
  role?: "admin" | "staff";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  role,
  children,
  fallback = null,
}) => {
  const { checkPermission, userRole } = usePermissions();

  // Check role-based access
  if (role) {
    const hasRole = (userRole ?? '').toLowerCase() === role.toLowerCase();
    return hasRole ? <>{children}</> : <>{fallback}</>;
  }

  // Check permission-based access
  if (permission) {
    const hasAccess = checkPermission(permission);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // If no permission or role specified, deny access
  return <>{fallback}</>;
};
