
import type { Metadata } from "next"
import { Kanit } from "next/font/google"

import type React from "react"
import ServerSession from "@/components/ServerSession"
import "./globals.css"
import { getServerSession } from "next-auth"
import { ThemeProvider } from "@/components/ThemeProvider"
import { LanguageProvider } from "@/contexts"

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
    <html lang="th">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Favicon variants using logo_dark.png / logo_light.png */}
        <link rel="icon" type="image/png" sizes="32x32" href="/logo_light.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo_dark.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo_dark.png" />
      </head>
      <body className={kanit.className}>
        <ServerSession session={session}>
          <LanguageProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </LanguageProvider>
        </ServerSession>
      </body>
    </html>
  )
}
