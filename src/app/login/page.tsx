"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import AuthService from "../../lib/services/AuthService"
import { useSession, signIn } from "next-auth/react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations } from "@/lib/utils/Language"

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { theme } = useTheme()
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { lang } = useLanguage()
    const t = translations[lang] || translations.en

    // เช็ค error จาก URL parameters ที่ Google callback ส่งมา
    useEffect(() => {
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
            console.log("OAuth Error from URL:", errorParam)
            console.log("Error Description:", errorDescription)
            
            // แสดง error message ตาม error code ที่ได้จาก URL
            switch (errorParam) {
                case 'OAuthCallback':
                    setError("การเชื่อมต่อกับ Google ล้มเหลว")
                    break;
                case 'OAuthSignin':
                    setError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง")
                    break;
                case 'OAuthCreateAccount':
                    setError("ไม่พบบัญชีผู้ใช้ที่เชื่อมโยงกับ Google")
                    break;
                case 'CallbackRouteError':
                    setError("เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง")
                    break;
                case 'Verification':
                    setError("การยืนยันตัวตนล้มเหลว กรุณาลองใหม่อีกครั้ง")
                    break;
                case 'AccessDenied':
                case 'access_denied':
                    setError("การเข้าถึงถูกปฏิเสธ กรุณาอนุญาตการเข้าถึงข้อมูลจาก Google")
                    break;
                case 'Configuration':
                    setError("การตั้งค่า OAuth ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ")
                    break;
                default:
                    setError("")
            }
            
            // ล้าง error parameters จาก URL
            const url = new URL(window.location.href)
            url.searchParams.delete('error')
            url.searchParams.delete('error_description')
            url.searchParams.delete('callbackUrl')
            window.history.replaceState({}, '', url.pathname)
        }
    }, [searchParams])

    useEffect(() => {
        if (status === "authenticated") {
            console.log("User authenticated, redirecting to dashboard...")
            router.push("/home/dashboard")
        }
    }, [status, router])

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError("") // ล้าง error เก่า
        
        try {
            console.log("Starting Google Sign-In...")
            // ใช้ redirect: true เพื่อให้ NextAuth จัดการ redirect เอง
            await signIn('google', { 
                callbackUrl: '/home/dashboard' ,
                redirect: false
            })
        } catch (error: any) {
            console.error("Google Sign-In Exception:", error);
            setError(`เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ: ${error?.message || 'Unknown error'}`)
            setLoading(false)
        }
        // ไม่ต้อง setLoading(false) เพราะจะ redirect ออกจากหน้านี้
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        if (!email || !password) {
            setLoading(false)
            setError(t.fillAllFields || "Please fill in all fields.")
            return
        }

        AuthService.credentialsLogin(email, password).then((success) => {
            setLoading(false)
            if (success) {
                router.push("/home/dashboard")
            } else {
                setError(t.invalidCredentials || "Invalid email or password. Please try again.")
            }
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 ">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    {theme === "dark" ? (
                        <div className="flex justify-center mb-4">
                            <Image src="/logo_dark.png" alt="Company Logo" width={120} height={120} className="object-contain" />
                        </div>
                    ) : (
                        <div className="flex justify-center mb-4">
                            <Image src="/logo_light.png" alt="Company Logo" width={120} height={120} className="object-contain" />
                        </div>
                    )}
                </div>

                <Card className="border border-slate-200 shadow-lg">
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2 mt-4">
                                <Label htmlFor="email">{t.email}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder={t.enterYourEmail}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">{t.password}</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder={t.enterYourPassword}
                                        className="pl-10 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                                {loading ? t.pleaseWait : t.signIn}
                            </Button>

                            {/* Divider */}
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">{t.orContinueWith}</span>
                                </div>
                            </div>

                            {/* Google Sign-In Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                {t.signInWithGoogle}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500">© 2024 Inventory Management System. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
