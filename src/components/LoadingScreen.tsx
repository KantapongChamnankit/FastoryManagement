"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"

interface LoadingScreenProps {
  onLoadingComplete: () => void,
  complete?: boolean,
}

export function LoadingScreen({ onLoadingComplete, complete, }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const { theme } = useTheme()
  console.log("LoadingScreen rendered with theme:", theme)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => onLoadingComplete(), 500)
          return 100
        }
        return prev + 2
      })
    }, complete ? 5 : 40)

    return () => clearInterval(interval)
  }, [onLoadingComplete])

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[2147483647] dark:bg-[#121212] dark:border-[#333333]">
      <div className="text-center space-y-8">
        {/* Logo with opacity animation */}
        <div className="relative">
          {theme === "dark" ? (
            <Image
              src="/logo_dark.png"
              alt="Company Logo"
              width={120}
              height={120}
              className="mx-auto"
              style={{
                opacity: (Math.sin((progress / 100) * Math.PI * 2) + 1) / 2,
                transition: "opacity 0.1s ease-in-out",
              }}
            />
          ) : (
            <Image
              src="/logo_light.png"
              alt="Company Logo"
              width={120}
              height={120}
              className="mx-auto"
              style={{
                opacity: (Math.sin((progress / 100) * Math.PI * 2) + 1) / 2,
                transition: "opacity 0.1s ease-in-out",
              }}
            />
          )}
        </div>

        {/* Loading text and progress */}
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-80 mx-auto">
            <div className="w-full bg-slate-200 h-2">
              <div className="bg-blue-600 h-2 transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-slate-500 mt-2">{progress}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
