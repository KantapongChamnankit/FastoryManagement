"use client"

import { useLanguage } from "@/contexts";
import { translations } from "@/lib/utils/Language";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Bell, RotateCcw, Package, Camera, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createSettings, dropDB, getSettings, updateSettings } from "@/lib/services/SettingService";
import { updateUser, findById } from "@/lib/services/UserService";
import { useLowStockMonitor } from "@/hooks/useLowStockMonitor";
import { useTheme } from "next-themes";
import Loading from "./loading";
import { ISettings } from "@/lib/interface/ISetting";
import { IUser } from "@/lib/interface/IUser";
import { usePermissions } from "@/hooks/use-permissions";

// Extend the session type to include id
interface ExtendedUser {
    id?: string
    email?: string | null
    name?: string | null
    role?: string
}

interface ExtendedSession {
    user?: ExtendedUser
}

interface ProfileData {
    first_name: string
    last_name: string
    profile_image: string
}

export default function SettingsPage() {
    const lang = useLanguage()
    const t = translations[lang.lang] || translations.en
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const { theme } = useTheme()
    const { checkLowStock } = useLowStockMonitor()
    const { data: session, update: updateSession } = useSession()
    const { isAdmin } = usePermissions()
    const extendedSession = session as ExtendedSession
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Profile state
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        profile_image: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'
    })
    const [profileLoading, setProfileLoading] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Load user profile data
                if (extendedSession?.user?.id) {
                    const userData = await findById(extendedSession.user.id);
                    if (userData) {
                        setProfileData({
                            first_name: userData.first_name || '',
                            last_name: userData.last_name || '',
                            profile_image: userData.image_id || 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'
                        });
                    }
                }

                // Load settings
                const serverSettings = await getSettings();
                if (serverSettings) {
                    setLowStockThreshold(serverSettings.lowStockThreshold);
                    setEnableLowStockAlerts(serverSettings.enableLowStockAlerts);
                    setEnableEmailNotifications(serverSettings.enableEmailNotifications);
                    setEnablePushNotifications(serverSettings.enablePushNotifications);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                // Use default settings on error
                const defaultSettings = await getSettings();
                if (!defaultSettings) return
                setLowStockThreshold(defaultSettings.lowStockThreshold);
                setEnableLowStockAlerts(defaultSettings.enableLowStockAlerts);
                setEnableEmailNotifications(defaultSettings.enableEmailNotifications);
                setEnablePushNotifications(defaultSettings.enablePushNotifications);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [extendedSession?.user?.id])

    // Settings state
    const [lowStockThreshold, setLowStockThreshold] = useState(10)
    const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true)
    const [enableEmailNotifications, setEnableEmailNotifications] = useState(true)
    const [enablePushNotifications, setEnablePushNotifications] = useState(false)

    const handleSaveSettings = async () => {
        const newSettings: ISettings = {
            lowStockThreshold,
            enableLowStockAlerts,
            enableEmailNotifications,
            enablePushNotifications
        };

        updateSettings(newSettings);

        // Also try to save to server if available
        try {
            await updateSettings({
                lowStockThreshold,
                enableLowStockAlerts,
                enableEmailNotifications,
                enablePushNotifications
            });
        } catch (error) {
            console.error("Error saving server settings:", error);
        }

        // If low stock alerts were just enabled, trigger an immediate check
        if (enableLowStockAlerts) {
            setTimeout(() => {
                checkLowStock();
            }, 1000);
        }

        toast({
            title: t.settingsUpdated || "Settings updated",
            description: t.yourPreferencesSaved || "Your preferences have been saved successfully.",
        })
    }

    const handleProfileUpdate = async () => {
        if (!extendedSession?.user?.id) return;

        setProfileLoading(true);
        try {
            await updateUser(extendedSession.user.id, {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                image_id: profileData.profile_image
            });

            // Force update the NextAuth session to reflect changes
            await updateSession();

            // Trigger a window event to notify other components
            window.dispatchEvent(new CustomEvent('profile-updated', {
                detail: {
                    first_name: profileData.first_name,
                    last_name: profileData.last_name,
                    image_id: profileData.profile_image
                }
            }));

            toast({
                title: t.profileUpdated || "Profile updated",
                description: t.profileUpdatedDesc || "Your profile has been updated successfully.",
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: t.error || "Error",
                description: t.failedToUpdateProfile || "Failed to update profile. Please try again.",
                variant: "destructive"
            });
        } finally {
            setProfileLoading(false);
        }
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // For now, we'll use a placeholder. In a real app, you'd upload to a service like AWS S3
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prev => ({
                    ...prev,
                    profile_image: reader.result as string
                }));
            };
            reader.readAsDataURL(file);

            toast({
                title: t.imageSelected || "Image selected",
                description: t.dontForgetSave || "Don't forget to save your changes!",
            });
        }
    }

    const handleResetData = async () => {
        await dropDB()

        toast({
            title: t.dataResetSuccess || "Data reset successfully",
            description: "All application data has been reset.",
            variant: "destructive"
        })
        window.location.reload()
    }

    if (loading) {
        return <Loading theme={theme ?? "dark"} />;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">{t.settings}</h1>
                <p className="text-slate-600">{t.settingsLabel}</p>
            </div>

            <div className="grid gap-6">
                {/* Profile Personalization */}
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                        <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">{t.profilePersonalization || "Profile Personalization"}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <CardDescription>
                            {t.customizeProfileInfo || "Customize your profile information and appearance"}
                        </CardDescription>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            {/* Profile Image */}
                            <div className="flex flex-col items-center space-y-3">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage
                                        src={profileData.profile_image}
                                        alt={t.profilePicture || "Profile picture"}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="text-lg">
                                        {profileData.first_name.charAt(0)}{profileData.last_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-fit"
                                >
                                    <Camera className="h-4 w-4 mr-2" />
                                    {t.changePhoto || "Change Photo"}
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Profile Information */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first-name">{t.firstName || "First Name"}</Label>
                                        <Input
                                            id="first-name"
                                            value={profileData.first_name}
                                            onChange={(e) => setProfileData(prev => ({
                                                ...prev,
                                                first_name: e.target.value
                                            }))}
                                            placeholder={t.enterFirstName || "Enter your first name"}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last-name">{t.lastName || "Last Name"}</Label>
                                        <Input
                                            id="last-name"
                                            value={profileData.last_name}
                                            onChange={(e) => setProfileData(prev => ({
                                                ...prev,
                                                last_name: e.target.value
                                            }))}
                                            placeholder={t.enterLastName || "Enter your last name"}
                                        />
                                    </div>
                                </div>

                                {/* Display only fields */}
                                <div className="space-y-2">
                                    <Label htmlFor="email-display" className="text-slate-500">{t.emailReadOnly || "Email (read-only)"}</Label>
                                    <Input
                                        id="email-display"
                                        value={extendedSession?.user?.email || ''}
                                        disabled
                                        className="bg-slate-50 text-slate-500"
                                    />
                                </div>

                                <Button
                                    onClick={handleProfileUpdate}
                                    disabled={profileLoading}
                                    className="w-fit"
                                >
                                    {profileLoading ? (t.updating || "Updating...") : (t.updateProfile || "Update Profile")}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Low Stock Alert Settings */}

                {isAdmin() ? (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                                <div className="flex items-center space-x-2">
                                    <Package className="h-5 w-5 text-orange-600" />
                                    <CardTitle className="text-lg">{t.lowStockAlert}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CardDescription>
                                    {t.lowStockAlertDesc}
                                </CardDescription>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="enable-low-stock">{t.enableLowStockAlerts}</Label>
                                        <Switch
                                            id="enable-low-stock"
                                            checked={enableLowStockAlerts}
                                            onCheckedChange={setEnableLowStockAlerts}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label htmlFor="threshold">{t.lowStockThreshold}</Label>
                                        <Input
                                            id="threshold"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={lowStockThreshold}
                                            onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                                            className="w-32"
                                            disabled={!enableLowStockAlerts}
                                        />
                                        <p className="text-sm text-slate-500">
                                            {t.lowStockThresholdDesc.replace("{threshold}", lowStockThreshold.toString())}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notification Settings */}
                        <Card>
                            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                                <div className="flex items-center space-x-2">
                                    <Bell className="h-5 w-5 text-blue-600" />
                                    <CardTitle className="text-lg">{t.notifications}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CardDescription>
                                    {t.notificationsDesc}
                                </CardDescription>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="enable-email">{t.enableEmailNotifications}</Label>
                                        <Switch
                                            id="enable-email"
                                            checked={enableEmailNotifications}
                                            onCheckedChange={setEnableEmailNotifications}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="enable-push">{t.enablePushNotifications}</Label>
                                        <Switch
                                            id="enable-push"
                                            checked={enablePushNotifications}
                                            onCheckedChange={setEnablePushNotifications}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Reset Data Settings */}
                        <Card className="border-red-200">
                            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                                <div className="flex items-center space-x-2">
                                    <RotateCcw className="h-5 w-5 text-red-600" />
                                    <CardTitle className="text-lg text-red-700">{t.resetData}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CardDescription className="text-red-600">
                                    {t.resetDataDesc}
                                </CardDescription>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-fit">
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            {t.resetAllData}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center space-x-2">
                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                                <span>Confirm Reset</span>
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t.confirmReset}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleResetData}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                {t.resetAllData}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <></>
                )}

                {/* Save Settings Button */}
                <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} className="w-fit">
                        {t.save} {t.settings}
                    </Button>
                </div>
            </div>
        </div>
    );
}
