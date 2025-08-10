"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useEffect } from "react"
import * as React from "react"

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
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { SidebarConfig } from "@/config"
import { UserProfile } from "./UserProfile"
import { ThemeToggle } from "./ToggleTheme"
import { useTheme } from "next-themes"
import { X } from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { lang, setLang } = useLanguage()
  const { isMobile, setOpenMobile } = useSidebar()
  const t = translations[lang]

  // Close mobile sidebar when navigating to a new page
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [pathname, isMobile, setOpenMobile])

  return (
    <Sidebar 
      variant="floating"
      side="left"
      collapsible={isMobile ? "offcanvas" : "icon"}
      className="border-r border-slate-200 dark:border-[#333333]"
      style={{
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        '--sidebar-background': theme === 'dark' ? '#000000' : '#ffffff',
        '--sidebar-foreground': theme === 'dark' ? '#ffffff' : '#000000',
      } as React.CSSProperties}
    >
      <SidebarHeader 
        className="border-b border-slate-200 dark:border-[#333333] p-4 md:p-6"
        style={{
          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        } as React.CSSProperties}
      >
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
            {theme === "dark" ? (
              <Image src="/logo_dark.png" alt="Company Logo" width={32} height={32} className="object-contain md:w-10 md:h-10" />
            ) : (
              <Image src="/logo_light.png" alt="Company Logo" width={32} height={32} className="object-contain md:w-10 md:h-10" />
            )}
            <div className="group-data-[collapsible=icon]:hidden">
              <h1 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Fastory</h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Management System</p>
            </div>
          </div>
          
          {/* Mobile close button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenMobile(false)}
              className="p-2 md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Language and Theme toggles */}
        <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2 group-data-[collapsible=icon]:hidden">
          <button
            onClick={() => setLang(lang === "en" ? "th" : "en")}
            className="px-2 md:px-3 py-1 rounded border text-xs font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition flex items-center justify-center"
          >
            {lang === "en" ? "TH" : "EN"}
          </button>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      
      <SidebarContent 
        className="p-2 md:p-4"
        style={{
          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        } as React.CSSProperties}
      >
        {SidebarConfig.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2 md:px-0 group-data-[collapsible=icon]:hidden">
              {t[group.label as keyof typeof t] || group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  className="
                  w-full justify-start px-2 md:px-3 py-2 text-sm transition-colors
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  data-[active=true]:bg-orange-50 data-[active=true]:text-orange-700
                  dark:data-[active=true]:bg-orange-900/20 dark:data-[active=true]:text-orange-400
                  data-[active=true]:border-r-2 data-[active=true]:border-orange-600
                  dark:data-[active=true]:border-orange-500
                  group-data-[collapsible=icon]:justify-center
                  group-data-[collapsible=icon]:px-4
                  group-data-[collapsible=icon]:flex
                  group-data-[collapsible=icon]:items-center
                  group-data-[collapsible=icon]:translate-x-2
                  group-data-[collapsible=icon]:h-5
                  group-data-[collapsible=icon]:w-5
                  group-data-[collapsible=icon]:py-3
                  group-data-[collapsible=icon]:text-base
                  "
                >
                  <Link
                  href={item.url}
                  className="
                    flex items-center gap-3 w-full
                    group-data-[collapsible=icon]:justify-center
                    group-data-[collapsible=icon]:gap-0
                    group-data-[collapsible=icon]:flex
                    group-data-[collapsible=icon]:items-center
                    group-data-[collapsible=icon]:px-4
                  "
                  >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">
                    {t[item.title as keyof typeof t] || item.title}
                  </span>
                  </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter 
        className="p-2 md:p-4 border-t border-slate-200 dark:border-[#333333]"
        style={{
          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        } as React.CSSProperties}
      >
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
}




