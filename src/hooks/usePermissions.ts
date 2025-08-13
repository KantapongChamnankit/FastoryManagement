"use client";

import { useSession } from "next-auth/react";
import { hasPermission, canAccessRoute } from "@/lib/permissions";
import { useEffect, useState } from "react";
import { Role } from "@/lib";
import * as RoleService from "@/lib/services/RoleService";

interface ExtendedUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
}

interface ExtendedSession {
  user?: ExtendedUser;
}

export const usePermissions = () => {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);

  const extendedSession = session as ExtendedSession;
  useEffect(() => {
    console.log((extendedSession.user as any)?.role);
    RoleService.findById((extendedSession.user as any)?.role).then((role) => {
        console.log(role, "role data");
        setUserRole(role?.name || null);
    })
  }, [status])


  const checkPermission = (permission: string): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };

  const checkRouteAccess = (route: string): boolean => {
    if (!userRole) return false;
    return canAccessRoute(userRole, route);
  };

  const isAdmin = (): boolean => {
    return (userRole ?? '').toLowerCase() === 'admin';
  };

  const isStaff = (): boolean => {
    return (userRole ?? '').toLowerCase() === 'staff';
  };

  return {
    userRole,
    checkPermission,
    checkRouteAccess,
    isAdmin,
    isStaff,
  };
};
