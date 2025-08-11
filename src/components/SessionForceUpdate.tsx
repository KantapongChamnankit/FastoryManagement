"use client"

import { signOut, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useToast } from "./ui/use-toast"
import { IUser } from "@/lib"
import { NextRouter, useRouter } from "next/router"
import * as UserService from "@/lib/services/UserService"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export default function SessionForceUpdate({ router }: { router: AppRouterInstance }) {
    let { data: session, update } = useSession({ required: true, onUnauthenticated: () => router.push("/login") })
    const [user, setUser] = useState<IUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false)
    const { toast, } = useToast()

    useEffect(() => {
        const waitForId = async () => {
            let session_update = await update();
            session = { ...session_update, user: { _id: (session_update?.user as any)?.id } as any } as any
            console.log(session, "session_update")

            return (session?.user as any)?._id
        }
        const fetchUser = async () => {
            console.log((session?.user as any), "kkkk")
            const user = await UserService.findById((session?.user as any)._id)
            console.log(user, "user data")
            if (user) {
                setUser(user)
            } else {
                setUser(null)
            }
            setLoading(false)
        }

        async function load() {
            return await new Promise((resolve) => {
                waitForId().then((isHasId) => {
                    console.log(isHasId, "ll")
                    if (isHasId) {
                        fetchUser().then(() => {
                            setLoading(false)
                            resolve(true)
                        })
                    } else {
                        load()
                    }
                })
            })
        }



        load().then(() => {
            console.log(loading, user, (session?.user as any), "loading and user")
            if (!(session?.user as any)?._id) return load();
            if (!loading && !user && (session?.user as any)?._id) {
                signOut({ redirect: false }).then(() => {
                    router.push("/login");
                })
            } else {
                if (!hasShownWelcomeToast && user) {
                    toast({
                        title: "Welcome back!",
                        description: `Hello ${user.first_name} ${user.last_name}`,
                    })
                    setHasShownWelcomeToast(true)
                }
            }
        })
    }, [loading])

    return (
        <></>
    )
}
