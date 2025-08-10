"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { formatDistanceToNow } from "date-fns"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Toaster } from "@/components/ui/toaster"
import { LoadingScreen } from "@/components/LoadingScreen"
import { Chatbot } from "@/components/Chatbot"
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

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [notification, setNotification] = useState<INotification[]>([])
  const pathname = usePathname()
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false)
  const { data: session, status } = useSession({ required: true })

  // Initialize low stock monitoring
  const { checkLowStock } = useLowStockMonitor()

  const fetchNotifications = useCallback(async () => {
    if (status === "authenticated" && (session?.user as any)?.id) {
      try {
        const notifications = await NotificationService.getNotificationsByUserId((session?.user as any)?.id);
        setNotification(notifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    }
  }, [session, status]);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.id && !hasShownWelcomeToast) {
      console.log("User authenticated:", session?.user)
      NotificationService.createNotification({
        userId: (session?.user as any)?.id,
        title: "You are logged in",
        message: `Welcome back! You are logged in at ${new Date().toLocaleString()}`,
        type: "success"
      }).then((data) => {
        console.log(data, "Notification added")
        setHasShownWelcomeToast(true)
        fetchNotifications();
      });
    }
  }, [status])

  const getNotificationIcon = (type: string) => {
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
  }

  const markAsRead = (id: string) => {
    setNotification(prev => prev.map(notif =>
      notif._id === id ? { ...notif, read: true } : notif
    ))
    NotificationService.markNotificationAsRead(id).catch(err => {
      console.error("Failed to mark notification as read:", err)
    })
  }

  const markAllAsRead = () => {
    setNotification(prev => prev.map(notif => ({ ...notif, read: true })))
    notification.forEach(notif => {
      NotificationService.markNotificationAsRead(notif._id as string).catch(err => {
        console.error("Failed to mark notification as read:", err)
      })
    })
  }

  const removeNotification = (id: string) => {
    setNotification(prev => prev.filter(notif => notif._id !== id))
    NotificationService.removeNotification(id).catch(err => {
      console.error("Failed to remove notification:", err)
    })
  }

  const unreadCount = notification.filter(n => !n.read).length

  return (
    <>
      {isLoading ? (
        <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />
      ) : (
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
              <nav className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 py-2 border-b border-slate-200 bg-white dark:bg-[#121212] dark:border-[#333333] text-sm md:text-lg">
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
                <div className="flex items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                      >
                        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs"
                          >
                            Mark all as read
                          </Button>
                        )}
                      </div>
                      <ScrollArea className="h-96">
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
                                        {getNotificationIcon(notif.type)}
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
                            <p className="text-sm">No notifications</p>
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
                                View all notifications
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                  <span>All Notifications</span>
                                  {unreadCount > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={markAllAsRead}
                                      className="text-xs"
                                    >
                                      Mark all as read ({unreadCount})
                                    </Button>
                                  )}
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
                                            {getNotificationIcon(notif.type)}
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
                                                  Mark as read
                                                </Button>
                                              )}
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeNotification(notif._id as string)}
                                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                              >
                                                Remove
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
                                  <p className="text-lg font-medium mb-2">No notifications</p>
                                  <p className="text-sm">You're all caught up!</p>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </nav>
              <main className="flex-1 bg-gray-50 dark:bg-[#050505] p-4 md:p-6 lg:p-8 overflow-auto">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      )}
      <Toaster />
      <Chatbot />
    </>
  )
}
