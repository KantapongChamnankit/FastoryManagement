"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { LogOut, User } from "lucide-react"
import { IRole, IUser } from "@/lib"
import { signOut, useSession } from "next-auth/react"
import * as UserService from "@/lib/services/UserService"
import * as RoleService from "@/lib/services/RoleService"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations } from "@/lib/utils/Language"

// Extend the session type to include id
interface ExtendedUser {
    id?: string
    email?: string | null
    name?: string | null
    role?: string
}

interface ExtendedSession {
    user?: ExtendedUser
}

export function UserProfile() {
    const [user, setUser] = useState<IUser | null>(null)
    const [role, setRole] = useState<IRole[] | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { lang } = useLanguage()
    const t = translations[lang] || translations.en
    let { data: session, status, update } = useSession({ required: true })

    const extendedSession = session as ExtendedSession

    useEffect(() => {
        async function fetchUserAndRoles() {
            if (status !== 'authenticated' || !extendedSession?.user?.id) {
                setUser(null)
                setRole(null)
                return
            }

            const userId = extendedSession.user.id

            try {
                console.log(userId)
                await new Promise((resolve) => {
                    UserService.findById(userId).then((userData) => {
                        if (!userData) {
                            console.log("User not found")
                            setUser(null)
                            return
                        }
                        setUser(userData || null)
                        RoleService.list().then((roleData) => {
                            setRole(roleData || null)
                            resolve(null)
                        })
                    })
                })
                return
            } catch (error) {
                console.error("Failed to fetch user data:", error)
                setUser(null)
                setRole(null)
                return;
            }
        }

        fetchUserAndRoles().then((res) => {
            console.log(user, role)
        })
    }, [status, extendedSession?.user?.id])

    // Listen for profile updates
    useEffect(() => {
        const handleProfileUpdate = () => {
            // Refetch user data when profile is updated
            if (extendedSession?.user?.id) {
                UserService.findById(extendedSession.user.id).then((userData) => {
                    if (userData) {
                        setUser(userData);
                    }
                });
            }
        };

        window.addEventListener('profile-updated', handleProfileUpdate);
        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, [extendedSession?.user?.id]);

    const handleSignOut = useCallback(async () => {
        try {
            setLoading(true)
            await signOut({ redirect: false })
            router.push("/")
        } catch (error) {
            console.error("Sign out error:", error)
        } finally {
            setLoading(false)
        }
    }, [router])

    // Memoize the user's role name to avoid recalculating on every render
    const userRoleName = useMemo(() => {
        if (!user || !role) return ""
        return role.find((r) => r._id === user.role_id)?.name ?? ""
    }, [user, role])

    // Memoize the full name
    const fullName = useMemo(() => {
        if (!user) return ""
        return `${user.first_name || ""} ${user.last_name || ""}`.trim()
    }, [user?.first_name, user?.last_name])

    return (
        user && role ? (
            <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 group-data-[collapsible=icon]:justify-center">
                    <Image
                        src={user.image_id || 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'}
                        alt="User Avatar"
                        width={40}
                        height={40}
                        className="object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {fullName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user?.email ?? ""}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-slate-500">
                                {userRoleName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sign Out Button */}
                <Button
                    onClick={handleSignOut}
                    disabled={loading}
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                >
                    <LogOut className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
                    <span className="group-data-[collapsible=icon]:hidden">
                        {loading ? (t.signingOut || "Signing out...") : (t.logout || "Sign Out")}
                    </span>
                </Button>
            </div>
        ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 animate-pulse group-data-[collapsible=icon]:justify-center">
                <div className="w-10 h-10 bg-slate-200 rounded"></div>
                <div className="flex-1 group-data-[collapsible=icon]:hidden">
                    <div className="h-4 bg-slate-200 rounded mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
            </div>
        )
    )
}
