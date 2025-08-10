
import type { Metadata } from "next"
import { Kanit } from "next/font/google"

import type React from "react"
import ServerSession from "@/components/ServerSession"
import "./globals.css"
import { getServerSession } from "next-auth"
import { ThemeProvider } from "@/components/ThemeProvider"

const kanit = Kanit({ subsets: ["latin", "thai"], weight: ["400", "500", "700"] })

export const metadata: Metadata = {
  title: "Fastory",
  description: "A fast and simple way to create a blog with Next.js"
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  return (
    <html lang="en">
      <body className={kanit.className}>
        <ServerSession session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </ServerSession>
      </body>
    </html>
  )
}
