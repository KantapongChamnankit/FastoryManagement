"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { SidebarConfig } from "@/config"
import { UserProfile } from "./UserProfile"
import { ThemeToggle } from "./ToggleTheme"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/router"

export function AppSidebar() {
  const pathname = usePathname()
  const { lang, setLang } = useLanguage()
  const t = translations[lang]

  return (
    <Sidebar className="border-r border-slate-200 bg-white dark:bg-[#121212] dark:border-[#333333]">
      <SidebarHeader className="border-b border-slate-200 dark:border-[#333333] p-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Company Logo" width={40} height={40} className="object-contain" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Fastory</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Management System</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "th" : "en")}
            className="px-3 py-1 rounded border text-xs font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition flex items-center justify-center"
          >
            {lang === "en" ? "TH" : "EN"}
          </button>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        {SidebarConfig.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {t[group.label as keyof typeof t] || group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="w-full justify-start px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-700 dark:data-[active=true]:bg-orange-900/20 dark:data-[active=true]:text-orange-400 data-[active=true]:border-r-2 data-[active=true]:border-orange-600 dark:data-[active=true]:border-orange-500"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{t[item.title as keyof typeof t] || item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-slate-200">
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
}




