"use client"
import Loading from '@/app/home/categories/loading'
import { useTheme } from 'next-themes'
import React from 'react'

interface ChartLoaderProps {
  label?: string
  height?: number | string
  size?: number
  className?: string
  thickness?: number
  fromColor?: string
  viaColor?: string
  toColor?: string
  trackColor?: string
  variant?: 'ring' | 'bars' | 'dots'
  labelPosition?: 'bottom' | 'inside' | 'none'
  ariaLabel?: string
  preset?: 'default' | 'white'
}

/*
  Modern Chart Loader
  - Variants: ring (default animated gradient ring), bars (pulsing vertical bars), dots (bouncing dots orbit)
  - Customizable gradient colors & thickness
  - Accessible: role=status + aria-live; reduced motion fallback
  - Dark mode aware via using semi-transparent track color
*/
export const ChartLoader: React.FC<ChartLoaderProps> = React.memo(({
  label = 'Loading…',
  ariaLabel,
  height = 300,
  size = 72,
  thickness = 8,
  fromColor = '#6366f1',
  viaColor = '#0ea5e9',
  toColor = '#10b981',
  trackColor = 'rgba(148,163,184,0.15)',
  variant = 'ring',
  labelPosition = 'bottom',
  className = '',
  preset = 'white'
}) => {
  const { theme } = useTheme()
  return (
    <Loading theme={theme ?? "dark"}/>
  )
})

export default ChartLoader
