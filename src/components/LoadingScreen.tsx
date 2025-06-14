"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface LoadingScreenProps {
  onLoadingComplete: () => void
}

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)

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
    }, 20)

    return () => clearInterval(interval)
  }, [onLoadingComplete])

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 dark:bg-[#121212] dark:border-[#333333]">
      <div className="text-center space-y-8">
        {/* Logo with opacity animation */}
        <div className="relative">
          <Image
            src="/logo.png"
            alt="Company Logo"
            width={120}
            height={120}
            className="mx-auto"
            style={{
              opacity: (Math.sin((progress / 100) * Math.PI * 2) + 1) / 2,
              transition: "opacity 0.1s ease-in-out",
            }}
          />
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
