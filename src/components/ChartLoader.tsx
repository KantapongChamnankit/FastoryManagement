"use client"
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
export const ChartLoader: React.FC<ChartLoaderProps> = ({
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
  const radiusOuter = 50 - thickness;
  const radiusInner = radiusOuter - thickness * 1.7;

  // Apply preset overrides (white modern minimal)
  const effectiveFrom = preset === 'white' ? '#ffffff' : fromColor;
  const effectiveVia = preset === 'white' ? '#f1f5f9' : viaColor;
  const effectiveTo = preset === 'white' ? '#ffffff' : toColor;
  const effectiveTrack = preset === 'white'
    ? 'rgba(255,255,255,0.18)'
    : trackColor;

  const showLabel = label && labelPosition !== 'none';

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${className}`}
      style={{ height }}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || label}
    >
      <div
        className={`relative flex items-center justify-center ${labelPosition === 'inside' ? 'pb-2' : ''}`}
        style={{ width: size, height: size }}
      >
        {variant === 'ring' && (
          <>
            <svg
              className="animate-cl-spin-slow drop-shadow-sm"
              viewBox="0 0 100 100"
              width={size}
              height={size}
            >
              <defs>
                <linearGradient id="chartLoaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={effectiveFrom} />
                  <stop offset="50%" stopColor={effectiveVia} />
                  <stop offset="100%" stopColor={effectiveTo} />
                </linearGradient>
                <linearGradient id="chartLoaderGradientAlt" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={effectiveTo} />
                  <stop offset="50%" stopColor={effectiveVia} />
                  <stop offset="100%" stopColor={effectiveFrom} />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r={radiusOuter}
                fill="none"
                stroke={effectiveTrack}
                strokeWidth={thickness}
              />
              <circle
                cx="50"
                cy="50"
                r={radiusOuter}
                fill="none"
                stroke="url(#chartLoaderGradient)"
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray="210 140"
                className="animate-cl-dash"
              />
              <circle
                cx="50"
                cy="50"
                r={radiusInner}
                fill="none"
                stroke={effectiveFrom}
                strokeOpacity={0.18}
                strokeWidth={thickness * 0.75}
              />
              <circle
                cx="50"
                cy="50"
                r={radiusInner}
                fill="none"
                stroke="url(#chartLoaderGradientAlt)"
                strokeWidth={thickness * 0.75}
                strokeLinecap="round"
                strokeDasharray="60 100"
                className="animate-cl-dash-fast animate-cl-spin-reverse"
              />
            </svg>
            <div className="absolute inset-0 rounded-full blur-xl opacity-40 dark:opacity-30 bg-[radial-gradient(circle_at_30%_30%,var(--cl-glow-from),transparent_70%)] pointer-events-none" style={{
              // CSS variables for dynamic glow coloring
              ['--cl-glow-from' as any]: (preset === 'white' ? '#ffffff55' : fromColor + '55')
            }} />
          </>
        )}
        {variant === 'bars' && (
          <div className="flex items-end justify-center gap-[3px] w-full h-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-[14%] rounded-full bg-gradient-to-b from-[var(--cl-bar-from)] via-[var(--cl-bar-via)] to-[var(--cl-bar-to)] animate-cl-bar"
                style={{
                  ['--cl-bar-from' as any]: preset === 'white' ? 'rgba(255,255,255,0.75)' : fromColor,
                  ['--cl-bar-via' as any]: preset === 'white' ? 'rgba(255,255,255,0.55)' : viaColor,
                  ['--cl-bar-to' as any]: preset === 'white' ? 'rgba(255,255,255,0.35)' : toColor,
                  animationDelay: `${i * 0.12}s`
                }}
              />
            ))}
          </div>
        )}
        {labelPosition === 'inside' && showLabel && (
          <span className="absolute text-[10px] font-medium tracking-wide uppercase text-slate-500/70 dark:text-slate-400/70 px-1 text-center">
            {label}
          </span>
        )}
      </div>
      {labelPosition === 'bottom' && showLabel && (
        <span className="mt-3 text-xs font-medium tracking-wide uppercase text-slate-500/70 dark:text-slate-400/70">
          {label}
        </span>
      )}
      <style jsx>{`
        /* Base animations */
        .animate-cl-spin-slow { animation: cl-spin 3s linear infinite; }
        .animate-cl-spin-reverse { animation: cl-spin-rev 5.2s linear infinite; }
        .animate-cl-dash { animation: cl-dash 2.8s ease-in-out infinite; }
        .animate-cl-dash-fast { animation: cl-dash 1.9s ease-in-out infinite; }
        .animate-cl-orbit { animation: cl-orbit 2.8s linear infinite; transform-origin: 50% ${size/2}px; }
        .animate-cl-bar { animation: cl-bar 1.1s ease-in-out infinite; }
        .animate-cl-dot { animation: cl-dot 1.4s ease-in-out infinite; }

        @keyframes cl-spin { to { transform: rotate(360deg); } }
        @keyframes cl-spin-rev { to { transform: rotate(-360deg); } }
        @keyframes cl-dash {
          0% { stroke-dasharray: 18 330; stroke-dashoffset: 0; }
          45% { stroke-dasharray: 250 90; stroke-dashoffset: -40; }
          100% { stroke-dasharray: 18 330; stroke-dashoffset: -340; }
        }
        @keyframes cl-orbit { to { transform: rotate(360deg); } }
        @keyframes cl-bar {
          0%, 100% { transform: scaleY(0.3); opacity: .35; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes cl-dot {
          0%, 100% { transform: scale(0.55) translateZ(0); opacity: .4; }
          50% { transform: scale(1) translateZ(0); opacity: 1; }
        }
        @keyframes cl-dash-fast {
          0% { stroke-dasharray: 10 120; stroke-dashoffset: 0; }
          50% { stroke-dasharray: 90 40; stroke-dashoffset: -30; }
          100% { stroke-dasharray: 10 120; stroke-dashoffset: -180; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-cl-spin-slow,
          .animate-cl-spin-reverse,
          .animate-cl-dash,
          .animate-cl-dash-fast,
          .animate-cl-orbit,
          .animate-cl-bar,
          .animate-cl-dot { animation: none !important; }
          .animate-cl-spin-slow circle[stroke^='url'],
          .animate-cl-spin-reverse circle[stroke^='url'] { stroke-dasharray: 60 300; }
        }
      `}</style>
    </div>
  )
}

export default ChartLoader
