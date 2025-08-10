"use client"

import { useLanguage } from "@/contexts";
import { translations } from "@/lib/utils/Language";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Bell, RotateCcw, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { useLowStockMonitor } from "@/hooks/useLowStockMonitor";
import { useTheme } from "next-themes";
import Loading from "./loading";
import { ISettings } from "@/lib/interface/ISetting";

export default function SettingsPage() {
    const lang = useLanguage()
    const t = translations[lang.lang] || translations.en
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const { theme } = useTheme()
    const { checkLowStock } = useLowStockMonitor()

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Also try to get server settings if available
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
    }, [])

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
            description: "Your preferences have been saved successfully.",
        })
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
                {/* Low Stock Alert Settings */}
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
