"use client";

import { usePermissions } from "@/hooks/use-permissions";

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

  if (userRole === null) {
    return (
      //make opacity 25%
      <div className="bg-slate-50 animate-pulse">
        <div className="h-4 w-full bg-slate-200 rounded " style={{ opacity: 0.25 }}></div>
      </div>
    )
  }
  // Check role-based access
  if (role) {
    const hasRole = (userRole ?? '').toLowerCase() === role.toLowerCase();
    return hasRole ? <>{children}</> : <>
      {fallback}
    </>;
  }

  // Check permission-based access
  if (permission) {
    const hasAccess = checkPermission(permission);
    return hasAccess ? <>{children}</> : <>
      {fallback}
    </>;
  }

  // If no permission or role specified, deny access
  return (
    <>
      {fallback}
    </>
  );
};
