'use client'

import ClientLayout from "@/components/ClientLayout"
import { ThemeProvider } from "@/components/ThemeProvider"
import { LanguageProvider } from "@/contexts"
import { getServerSession } from "next-auth"
import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    router.push("/login");
  }
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
