"use client"

import * as React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Toaster } from "@/components/ui/toaster"
import { LoadingScreen } from "@/components/LoadingScreen"
import dynamic from "next/dynamic"
const Chatbot = dynamic(async () => {
  const mod = await import("@/components/Chatbot")
  return (mod as any).Chatbot ?? mod as any
}, {
  ssr: false,
  loading: () => <div className="py-6 text-center text-slate-400 text-xs">Loading assistant…</div>
})
import { RouteGuard } from "@/components/RouteGuard"
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb"
import { usePathname } from "next/navigation"
import { Bell, X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { INotification } from "@/lib/interface/INofication"
import * as NotificationService from "@/lib/services/NotificationService"
import { useSession } from "next-auth/react"
import { useLowStockMonitor } from "@/hooks/useLowStockMonitor"
import { usePermissions } from "@/hooks/use-permissions"
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext"
import { useTranslation } from "@/hooks/useTranslation"
import { translations } from "@/lib/utils/Language"
import { ThemeToggle } from "./ToggleTheme"

// Memoized notification icon component
const NotificationIcon = React.memo(({ type }: { type: string }) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'error':
      return <X className="h-4 w-4 text-red-500" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-orange-500" />
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
})
NotificationIcon.displayName = "NotificationIcon"

// Memoized breadcrumb component
const DynamicBreadcrumb = React.memo(({ pathname }: { pathname: string }) => {
  const breadcrumbItems = useMemo(() => {
    return pathname
      .split("/")
      .filter(Boolean)
      .map((segment, idx, arr) => ({
        segment: segment.charAt(0).toUpperCase() + segment.slice(1),
        isLast: idx === arr.length - 1
      }))
  }, [pathname])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden sm:block">
          Fastory
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden sm:block" />
        <BreadcrumbEllipsis className="hidden sm:block" />
        <BreadcrumbSeparator className="hidden sm:block" />
        {breadcrumbItems.map((item, idx) =>
          item.isLast ? (
            <BreadcrumbPage key={idx} className="text-slate-900 dark:text-white text-sm md:text-base">
              {item.segment}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbItem key={idx} className="hidden md:block">
              <BreadcrumbLink className="text-sm">
                {item.segment}
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>
          )
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
})
DynamicBreadcrumb.displayName = "DynamicBreadcrumb"

const ClientLayout = React.memo(function ClientLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [notification, setNotification] = useState<INotification[]>([])
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession({ required: true })
  const { isAdmin, isStaff, checkRouteAccess } = usePermissions()
  const { lang, setLang } = useLanguage()
  const t = translations[lang] || translations.en

  // Initialize low stock monitoring with debouncing
  const { checkLowStock } = useLowStockMonitor()

  // Optimized notification fetching with caching
  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !(session?.user as any)?.id) {
      return
    }

    try {
      const notifications = await NotificationService.getNotificationsByUserId((session?.user as any)?.id);
      setNotification(notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [session?.user, status]);

  // Listen for global notification updates
  useEffect(() => {
    const handleNotificationUpdate = () => {
      fetchNotifications();
    };

    // Listen for custom events
    window.addEventListener('notification-updated', handleNotificationUpdate);
    window.addEventListener('notification-sent', handleNotificationUpdate);

    return () => {
      window.removeEventListener('notification-updated', handleNotificationUpdate);
      window.removeEventListener('notification-sent', handleNotificationUpdate);
    };
  }, [fetchNotifications]);

  // Memoized notification handlers
  const markAsRead = useCallback((id: string) => {
    setNotification(prev => prev.map(notif =>
      notif._id === id ? { ...notif, read: true } : notif
    ))
    // Async operation without blocking UI
    NotificationService.markNotificationAsRead(id).catch((err: any) => {
      console.error("Failed to mark notification as read:", err)
    })
    window.dispatchEvent(new CustomEvent('notification-sent'));
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotification(prev => prev.map(notif => ({ ...notif, read: true })))
    // Batch async operations
    Promise.all(
      notification.map(notif =>
        NotificationService.markNotificationAsRead(notif._id as string)
      )
    ).catch((err: any) => {
      console.error("Failed to mark notifications as read:", err)
    })
    window.dispatchEvent(new CustomEvent('notification-sent'));
  }, [notification])

  const removeNotification = useCallback((id: string) => {
    setNotification(prev => prev.filter(notif => notif._id !== id))
    NotificationService.removeNotification(id).catch((err: any) => {
      console.error("Failed to remove notification:", err)
    })
    window.dispatchEvent(new CustomEvent('notification-sent'));
  }, [])

  // Delete all notifications
  const clearAllNotifications = useCallback(async () => {
    if (status !== "authenticated" || !(session?.user as any)?.id) return;
    const confirmMsg = (t as any).confirmDeleteAll || t.confirmDelete || 'Delete all notifications? This cannot be undone.';
    // Confirm on client
    if (typeof window !== 'undefined' && !window.confirm(confirmMsg)) return;
    try {
      await NotificationService.deleteAllNotifications((session?.user as any)?.id as string)
      setNotification([])
      window.dispatchEvent(new CustomEvent('notification-sent'))
    } catch (err) {
      console.error('Failed to delete all notifications:', err)
    }
  }, [session?.user, status, t])

  // Optimized welcome toast effect
  useEffect(() => {
    if (status === "authenticated" &&
      (session?.user as any)?.id &&
      !hasShownWelcomeToast) {

      // Debounce welcome notification
      const timeoutId = setTimeout(async () => {
        try {
          await NotificationService.createNotification({
            userId: (session?.user as any)?.id,
            title: t.welcomeLoginTitle?.replace("{time}", new Date().toLocaleString()) || "You are logged in",
            message: t.welcomeLoginMessage?.replace("{time}", new Date().toLocaleString()) || `Welcome back! You are logged in at ${new Date().toLocaleString()}`,
            type: "success"
          });
          setHasShownWelcomeToast(true)
          fetchNotifications();
        } catch (error) {
          console.error("Failed to create welcome notification:", error)
        }
      }, 1000) // 1 second delay

      return () => clearTimeout(timeoutId)
    }
  }, [status, session?.user, hasShownWelcomeToast, fetchNotifications])

  // Periodic notification refresh with longer intervals
  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications()

      // Reduced frequency: check every 60 seconds instead of every 30
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [status, fetchNotifications])

  // Memoized unread count
  const unreadCount = useMemo(() =>
    notification.filter((n: INotification) => !n.read).length,
    [notification]
  )

  return (
    <>
      {
        isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} complete={false} />
      }
      <div className="">
        <RouteGuard>
          <SidebarProvider
            defaultOpen={true}
            style={{
              "--sidebar-width": "16rem",
              "--sidebar-width-icon": "6rem",
            } as React.CSSProperties}
          >
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                {/* Top Navigation (fixed / sticky) */}
                <nav className="sticky top-0 z-50 h-24 flex items-center justify-between px-4 md:px-8 py-2 border-b border-slate-200 bg-white/95 dark:bg-[#121212]/90 dark:border-[#333333] backdrop-blur supports-[backdrop-filter]:backdrop-blur-md shadow-sm text-sm md:text-lg">
                  {/* Left side - Desktop + Mobile menu trigger + Breadcrumb */}
                  <div className="flex items-center space-x-4">
                    {/* Desktop sidebar trigger */}
                    <div className="hidden md:block">
                      <SidebarTrigger className="p-2" />
                    </div>

                    {/* Mobile menu trigger */}
                    <div className="md:hidden">
                      <SidebarTrigger className="p-2" />
                    </div>

                    {/* Breadcrumb */}
                    <div className="flex items-center">
                      <Breadcrumb>
                        <BreadcrumbList>
                          <BreadcrumbItem className="">
                            Fastory
                          </BreadcrumbItem>
                          {/* hidden when mobile */}
                          <BreadcrumbSeparator className="" />
                          <div className="flex items-center">
                            <BreadcrumbEllipsis className="hidden md:block py-2 px-1" />
                            <BreadcrumbSeparator className="hidden md:block" />
                          </div>
                          {pathname
                            .split("/")
                            .filter(Boolean)
                            .map((segment: string, idx: number, arr: string[]) =>
                              idx === arr.length - 1 ? (
                                <BreadcrumbPage key={idx} className="text-slate-900 dark:text-white text-sm">
                                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbItem key={idx} className="">
                                  <BreadcrumbLink className="text-sm">
                                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                                  </BreadcrumbLink>
                                  <BreadcrumbSeparator />
                                </BreadcrumbItem>
                              )
                            )}
                        </BreadcrumbList>
                      </Breadcrumb>
                    </div>
                  </div>

                  {/* Right side - Notifications */}
                  <div className="flex items-center gap-2">
                    {/* Language Toggle */}
                    <Button
                      onClick={() => setLang(lang === "en" ? "th" : "en")}
                      variant={"ghost"}
                      className="h-10 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center min-w-[40px]"
                    >
                      {lang === "en" ? "TH" : "EN"}
                    </Button>

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notification Bell */}
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-10 w-10"
                          >
                            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                            {unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </div>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[90vw] max-w-xs md:max-w-sm p-0" align="end">
                          <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold text-sm">{t.notifications}</h3>
                            <div className="flex items-center gap-2">
                              {unreadCount > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={markAllAsRead}
                                  className="text-xs"
                                >
                                  {t.markAllAsRead || 'Mark all as read'}
                                </Button>
                              )}
                            </div>
                          </div>
                          <ScrollArea className="h-[60vh] md:h-96">
                            {notification.length > 0 ? (
                              <div className="p-2">
                                {notification.map((notif, index) => (
                                  <div key={notif._id}>
                                    <div
                                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                                        }`}
                                      onClick={() => markAsRead(notif._id as string)}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                          <div className="mt-1">
                                            <NotificationIcon type={notif.type} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                              {notif.title}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                              {notif.message}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                              {formatDistanceToNow(new Date(notif.createdAt as number), { addSuffix: true })}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            removeNotification(notif._id as string)
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    {index < notification.length - 1 && <Separator className="my-1" />}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-8 text-center text-slate-500">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">{t.noNotifications || 'No notifications'}</p>
                              </div>
                            )}
                          </ScrollArea>
                          {notification.length > 0 && (
                            <div className="p-2 border-t">
                              <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="w-full text-sm"
                                  >
                                    {t.viewAllNotifications || 'View all notifications'}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[98vw] md:max-w-2xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center justify-between">
                                      <span>{t.allNotifications || 'All Notifications'}</span>
                                      <div className="flex items-center gap-2 translate-x-[-17px]">
                                        {unreadCount > 0 && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={markAllAsRead}
                                            className="text-xs"
                                          >
                                            {t.markAllAsRead || 'Mark all as read'} ({unreadCount})
                                          </Button>
                                        )}
                    {notification.length > 0 && (
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={clearAllNotifications}
                                            className="text-xs"
                                          >
                      {(t as any).deleteAll || t.delete || 'Delete all'}
                                          </Button>
                                        )}
                                      </div>
                                    </DialogTitle>
                                  </DialogHeader>
                                  <ScrollArea className="h-[60vh]">
                                    <div className="space-y-2 pr-4">
                                      {notification.map((notif, index) => (
                                        <div
                                          key={notif._id}
                                          className={`p-4 rounded-lg border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!notif.read
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 flex-1">
                                              <div className="mt-1">
                                                <NotificationIcon type={notif.type} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                                                    {notif.title}
                                                  </p>
                                                  {!notif.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                  )}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                                  {notif.message}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-2">
                                                  {formatDistanceToNow(new Date(notif.createdAt as number), { addSuffix: true })}
                                                </p>
                                                <div className="flex items-center gap-2 mt-3">
                                                  {!notif.read && (
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => markAsRead(notif._id as string)}
                                                      className="text-xs"
                                                    >
                                                      {t.markAsRead || 'Mark as read'}
                                                    </Button>
                                                  )}
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeNotification(notif._id as string)}
                                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  >
                                                    {t.remove || 'Remove'}
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                  {notification.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">
                                      <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                      <p className="text-lg font-medium mb-2">{t.noNotifications || 'No notifications'}</p>
                                      <p className="text-sm">{t.allCaughtUp || "You're all caught up!"}</p>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </nav>
                {/* Add padding top to prevent content hiding behind fixed nav */}
                <main className="flex-1 bg-gray-50 dark:bg-[#050505] pt-20 md:pt-24 p-4 md:p-6 lg:p-8 overflow-auto">{children}</main>
              </div>
            </div>
          </SidebarProvider>
        </RouteGuard>
      </div>
      <Toaster />
      <Chatbot />
    </>
  )
})

export default ClientLayout
