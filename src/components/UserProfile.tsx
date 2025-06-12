"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { LogOut } from "lucide-react"
import { IRole, IUser } from "@/lib"
import { signOut, useSession } from "next-auth/react"
import * as UserService from "@/lib/services/UserService"
import * as RoleService from "@/lib/services/RoleService"

export function UserProfile() {
    const [user, setUser] = useState<IUser | null>(null)
    const [role, setRole] = useState<IRole[] | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { data: session } = useSession()

    useEffect(() => {
        async function fetchUser() {
            const userId = (session?.user as any)?.id as string
            const userData = await UserService.findById(userId)
            if (userData) {
                setUser(userData)
            }
        }

        async function fetchRole() {
            const role = await RoleService.list()
            if (role) {
                setRole(role)
            } else {
                console.error("Failed to fetch roles")
            }
        }

        fetchRole()
        fetchUser()
    }, [])

    const handleSignOut = async () => {
        try {
            setLoading(true)
            await signOut({ redirect: false })
            router.push("/")
        } catch (error) {
            console.error("Sign out error:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="flex items-center gap-3 p-3 bg-slate-50 animate-pulse">
                <div className="w-10 h-10 bg-slate-200"></div>
                <div className="flex-1">
                    <div className="h-4 bg-slate-200 mb-1"></div>
                    <div className="h-3 bg-slate-200 w-2/3"></div>
                </div>
            </div>
        )
    }

    const initials = user.first_name + " " + user.last_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()

    return (
        <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200">
                <Image
                    src="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="object-cover border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.first_name + " " + user.last_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-green-500"></div>
                        <span className="text-xs text-slate-500">{role?.find((x) => x._id as string === user.role_id)?.name}</span>
                    </div>
                </div>
            </div>

            {/* Sign Out Button */}
            <Button
                onClick={handleSignOut}
                disabled={loading}
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
                <LogOut className="h-4 w-4 mr-2" />
                {loading ? "Signing out..." : "Sign Out"}
            </Button>
        </div>
    )
}
