"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { LoadingScreen } from "./LoadingScreen";

interface RouteGuardProps {
    children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { checkRouteAccess, userRole } = usePermissions();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Allow access to login page
        if (pathname === "/login" || pathname === "/") {
            return;
        }

        // Check if user has permission to access current route
        if (userRole && !checkRouteAccess(pathname)) {
            // Redirect to dashboard if admin, or to products page if staff
            const redirectTo = userRole.toLowerCase() === 'admin' ? '/home/dashboard' : '/home/products';
            router.push(redirectTo);
        } else if (userRole) {
            setIsLoading(false);
        }
    }, [pathname, checkRouteAccess, userRole, router]);

    if (isLoading) {
        return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
    }

    return <>{children}</>;
};
