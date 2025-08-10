import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { hasPermission } from "@/lib/permissions";
import { useEffect } from "react";
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

export async function withPermission(
  req: NextRequest,
  permission: string,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  try {
    const session = await getServerSession() as ExtendedSession;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role || '';
    const role = await RoleService.findById(userRole);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(role.name, permission)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req);
  } catch (error) {
    console.error("Permission check failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function withRole(
  req: NextRequest,
  allowedRoles: string[],
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  try {
    const session = await getServerSession() as ExtendedSession;
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role?.toLowerCase() || '';
    const role = await RoleService.findById(userRole);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const hasAllowedRole = allowedRoles.some(role => role.toLowerCase() === (role as any).name);
    
    if (!hasAllowedRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req);
  } catch (error) {
    console.error("Role check failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
