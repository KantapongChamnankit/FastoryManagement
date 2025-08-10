'use client'

import ClientLayout from "@/components/ClientLayout"
import { ThemeProvider } from "@/components/ThemeProvider"
import { LanguageProvider } from "@/contexts"
import { getServerSession } from "next-auth"
import { signOut, useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import * as UserService from "@/lib/services/UserService"
import { useEffect, useState } from "react"
import { IUser } from "@/lib"
import { useToast } from "@/hooks/use-toast"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
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
    <>
      <LanguageProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
      </LanguageProvider>
    </>
  )
}
