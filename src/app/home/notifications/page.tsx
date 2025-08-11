"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import { usePermissions } from "@/hooks/usePermissions"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
    Bell,
    Send,
    Users,
    Mail,
    AlertTriangle,
    Info,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Eye,
    Trash2,
    Plus,
    MessageSquare
} from "lucide-react"

// Services
import * as UserService from "@/lib/services/UserService"
import * as NotificationService from "@/lib/services/NotificationService"
import type { IUser, INotification } from "@/lib"
import Loading from "./loading"
import { useTheme } from "next-themes"

interface NotificationForm {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    category: 'system' | 'inventory' | 'sales' | 'user' | 'general'
    actionUrl?: string
    selectedUsers: string[]
}

interface UserWithStats extends IUser {
    notificationStats?: {
        total: number
        unread: number
        read: number
    }
}

export default function NotificationsPage() {
    const { lang } = useLanguage()
    const { isAdmin, checkPermission } = usePermissions()
    const { toast } = useToast()
    const t = translations[lang] || translations.en
    const { theme } = useTheme()

    // States
    const [users, setUsers] = useState<UserWithStats[]>([])
    const [notifications, setNotifications] = useState<INotification[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState("")
    const [notificationForm, setNotificationForm] = useState<NotificationForm>({
        title: "",
        message: "",
        type: "info",
        category: "general",
        actionUrl: "",
        selectedUsers: []
    })

    // Dialog states
    const [showSendDialog, setShowSendDialog] = useState(false)
    const [showViewDialog, setShowViewDialog] = useState(false)
    const [viewingUser, setViewingUser] = useState<UserWithStats | null>(null)
    const [sendingNotification, setSendingNotification] = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const usersData = await UserService.list()

            // Get notification stats for each user
            const usersWithStats = await Promise.all(
                usersData.map(async (user) => {
                    try {
                        const stats = await NotificationService.getNotificationStats(user._id!)
                        return { ...user, notificationStats: stats }
                    } catch (error) {
                        console.error(`Error fetching stats for user ${user._id}:`, error)
                        return { ...user, notificationStats: { total: 0, unread: 0, read: 0 } }
                    }
                })
            )

            setUsers(usersWithStats)
        } catch (error) {
            console.error("Error fetching users:", error)
            toast({
                title: "Error",
                description: "Failed to fetch users",
                variant: "destructive"
            })
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUserNotifications = async (userId: string) => {
        try {
            const userNotifications = await NotificationService.getNotificationsByUserId(userId, { limit: 50 })
            setNotifications(userNotifications)
        } catch (error) {
            console.error("Error fetching user notifications:", error)
            toast({
                title: "Error",
                description: "Failed to fetch notifications",
                variant: "destructive"
            })
        }
    }

    const handleSendNotification = async () => {
        if (!notificationForm.title || !notificationForm.message || notificationForm.selectedUsers.length === 0) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields and select at least one user",
                variant: "destructive"
            })
            return
        }

        setSendingNotification(true)
        try {
            await NotificationService.sendNotificationToUsers(
                notificationForm.selectedUsers,
                {
                    title: notificationForm.title,
                    message: notificationForm.message,
                    type: notificationForm.type,
                    category: notificationForm.category,
                    actionUrl: notificationForm.actionUrl || undefined
                }
            )

            toast({
                title: "Success",
                description: `Notification sent to ${notificationForm.selectedUsers.length} user(s)`,
            })

            // Trigger global notification refresh
            window.dispatchEvent(new CustomEvent('notification-sent'));

            // Reset form
            setNotificationForm({
                title: "",
                message: "",
                type: "info",
                category: "general",
                actionUrl: "",
                selectedUsers: []
            })

            setShowSendDialog(false)
            fetchUsers() // Refresh stats
        } catch (error) {
            console.error("Error sending notification:", error)
            toast({
                title: "Error",
                description: "Failed to send notification",
                variant: "destructive"
            })
        }
        setSendingNotification(false)
    }

    const handleViewUserNotifications = async (user: UserWithStats) => {
        setViewingUser(user)
        setShowViewDialog(true)
        await fetchUserNotifications(user._id!)
    }

    const handleDeleteNotification = async (notificationId: string) => {
        try {
            await NotificationService.deleteNotification(notificationId)
            toast({
                title: "Success",
                description: "Notification deleted successfully"
            })
            
            // Trigger global notification refresh
            window.dispatchEvent(new CustomEvent('notification-updated'));
            
            // Refresh notifications
            if (viewingUser) {
                await fetchUserNotifications(viewingUser._id!)
            }
            fetchUsers()
        } catch (error) {
            console.error("Error deleting notification:", error)
            toast({
                title: "Error",
                description: "Failed to delete notification",
                variant: "destructive"
            })
        }
    }    // Template notifications
    const notificationTemplates = [
        {
            title: "System Maintenance Notice",
            message: "The system will undergo maintenance on [DATE] from [TIME] to [TIME]. Please save your work.",
            type: "warning" as const,
            category: "system" as const
        },
        {
            title: "Low Stock Alert",
            message: "Several products are running low in stock. Please review inventory levels.",
            type: "warning" as const,
            category: "inventory" as const
        },
        {
            title: "Welcome Message",
            message: "Welcome to the FastoryManagement system! Please complete your profile setup.",
            type: "info" as const,
            category: "user" as const
        },
        {
            title: "Monthly Report Available",
            message: "Your monthly sales report is now available for review.",
            type: "success" as const,
            category: "sales" as const
        }
    ]

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'error': return <XCircle className="h-4 w-4 text-red-600" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
            case 'info': return <Info className="h-4 w-4 text-blue-600" />
            default: return <Bell className="h-4 w-4 text-gray-600" />
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-800'
            case 'error': return 'bg-red-100 text-red-800'
            case 'warning': return 'bg-yellow-100 text-yellow-800'
            case 'info': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const filteredUsers = users.filter(user =>
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Check admin permission - render appropriate content
    if (!isAdmin() || !checkPermission(PERMISSIONS.NOTIFICATIONS_MANAGE)) {
        return <Loading theme={theme ?? "dark"}></Loading>
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">{t.notifications}</h1>
                    <p className="text-slate-600">Manage user notifications and announcements</p>
                </div>
                <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Send className="h-4 w-4 mr-2" />
                            Send Notification
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full">
                        <DialogHeader>
                            <DialogTitle>Send Notification</DialogTitle>
                            <DialogDescription>
                                Create and send notifications to selected users
                            </DialogDescription>
                        </DialogHeader>
                        
                        <ScrollArea className="max-h-[70vh]">
                            <div className="space-y-4 pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={notificationForm.title}
                                            onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Notification title"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select
                                            value={notificationForm.type}
                                            onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, type: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">Info</SelectItem>
                                                <SelectItem value="success">Success</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                                <SelectItem value="error">Error</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={notificationForm.category}
                                            onValueChange={(value: any) => setNotificationForm(prev => ({ ...prev, category: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General</SelectItem>
                                                <SelectItem value="system">System</SelectItem>
                                                <SelectItem value="inventory">Inventory</SelectItem>
                                                <SelectItem value="sales">Sales</SelectItem>
                                                <SelectItem value="user">User</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="actionUrl">Action URL (Optional)</Label>
                                        <Input
                                            id="actionUrl"
                                            value={notificationForm.actionUrl}
                                            onChange={(e) => setNotificationForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                                            placeholder="/dashboard"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        value={notificationForm.message}
                                        onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                                        placeholder="Notification message"
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Templates (Click to use)</Label>
                                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                        {notificationTemplates.map((template, index) => (
                                            <div
                                                key={index}
                                                className="p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => setNotificationForm(prev => ({
                                                    ...prev,
                                                    title: template.title,
                                                    message: template.message,
                                                    type: template.type,
                                                    category: template.category
                                                }))}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getTypeIcon(template.type)}
                                                    <span className="font-medium text-xs">{template.title}</span>
                                                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                                                </div>
                                                <p className="text-xs text-gray-600 truncate">{template.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Select Users ({notificationForm.selectedUsers.length} selected)</Label>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setNotificationForm(prev => ({
                                                    ...prev,
                                                    selectedUsers: users.map(u => u._id!).filter(Boolean)
                                                }))}
                                                className="text-xs px-2"
                                            >
                                                All
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setNotificationForm(prev => ({ ...prev, selectedUsers: [] }))}
                                                className="text-xs px-2"
                                            >
                                                None
                                            </Button>
                                        </div>
                                    </div>
                                    <ScrollArea className="h-32 border rounded-md p-2">
                                        <div className="space-y-1">
                                            {users.map((user) => (
                                                <div key={user._id} className="flex items-center space-x-2 p-1">
                                                    <Checkbox
                                                        checked={notificationForm.selectedUsers.includes(user._id!)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setNotificationForm(prev => ({
                                                                    ...prev,
                                                                    selectedUsers: [...prev.selectedUsers, user._id!]
                                                                }))
                                                            } else {
                                                                setNotificationForm(prev => ({
                                                                    ...prev,
                                                                    selectedUsers: prev.selectedUsers.filter(id => id !== user._id)
                                                                }))
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium truncate">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {user.notificationStats?.unread || 0}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </ScrollArea>                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={() => setShowSendDialog(false)} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendNotification}
                                disabled={sendingNotification || !notificationForm.title || !notificationForm.message || notificationForm.selectedUsers.length === 0}
                                className="w-full sm:w-auto"
                            >
                                {sendingNotification ? "Sending..." : `Send to ${notificationForm.selectedUsers.length} user(s)`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Notifications</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold">
                            {users.reduce((sum, user) => sum + (user.notificationStats?.total || 0), 0)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Unread</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">
                            {users.reduce((sum, user) => sum + (user.notificationStats?.unread || 0), 0)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Read</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                            {users.reduce((sum, user) => sum + (user.notificationStats?.read || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users and Notifications Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Notifications
                    </CardTitle>
                    <CardDescription>
                        View and manage notifications for each user
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">User</TableHead>
                                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                                    <TableHead className="text-center w-16">Total</TableHead>
                                    <TableHead className="text-center w-16">Unread</TableHead>
                                    <TableHead className="text-center w-16 hidden sm:table-cell">Read</TableHead>
                                    <TableHead className="text-center w-20">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.image_id || 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'}
                                                    alt="Profile"
                                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border flex-shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm truncate">
                                                        {user.first_name} {user.last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 sm:hidden truncate">
                                                        {user.email}
                                                    </div>
                                                    <div className="text-xs">
                                                        {user.status === 'active' ? (
                                                            <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-gray-600 border-gray-200 text-xs">
                                                                Inactive
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600 hidden sm:table-cell max-w-[200px] truncate">{user.email}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="text-xs">
                                                {user.notificationStats?.total || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 text-xs">
                                                {user.notificationStats?.unread || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center hidden sm:table-cell">
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 text-xs">
                                                {user.notificationStats?.read || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewUserNotifications(user)}
                                                className="text-xs px-2"
                                            >
                                                <Eye className="h-3 w-3 sm:mr-1" />
                                                <span className="hidden sm:inline">View</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* View User Notifications Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Notifications for {viewingUser?.first_name} {viewingUser?.last_name}
                        </DialogTitle>
                        <DialogDescription>
                            {viewingUser?.email} • {notifications.length} notifications
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-3 pr-4">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No notifications found</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div key={notification._id} className={`p-3 border rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-2 flex-1">
                                                <div className="mt-1">
                                                    {getTypeIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h4 className="font-medium text-sm">{notification.title}</h4>
                                                        <Badge className={getTypeColor(notification.type)}>
                                                            {notification.type}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {notification.category}
                                                        </Badge>
                                                        {!notification.read && (
                                                            <Badge className="bg-blue-600 text-white text-xs">
                                                                New
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                                        <span>
                                                            {new Date(notification.createdAt || 0).toLocaleString()}
                                                        </span>
                                                        {notification.actionUrl && (
                                                            <span className="text-blue-600 truncate">
                                                                Action: {notification.actionUrl}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteNotification(notification._id!)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}