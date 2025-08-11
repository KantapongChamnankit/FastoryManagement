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
import SessionForceUpdate from "@/components/SessionForceUpdate"
import DataWrapper from "@/components/DataWraper"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <>
      <SessionForceUpdate router={router} />
        <ClientLayout>
          <DataWrapper>
            {children}
          </DataWrapper>
        </ClientLayout>
    </>
  )
}
