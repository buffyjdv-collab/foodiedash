'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

// Veg / Non-veg indicator square (Swiggy style)
export function VegDot({ isVeg, className }: { isVeg: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded-sm border',
        isVeg ? 'border-green-600' : 'border-red-500',
        className
      )}
      title={isVeg ? 'Pure Veg' : 'Non-Veg'}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isVeg ? 'bg-green-600' : 'bg-red-500'
        )}
      />
    </span>
  )
}

// Rating pill (green background)
export function RatingBadge({ rating, className }: { rating: number; className?: string }) {
  const color =
    rating >= 4.0 ? 'bg-green-700 text-white' : rating >= 3.5 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold',
        color,
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden>
        <path d="M12 17.27l-5.18 3.73 1.64-6.81L3 9.24l6.91-.51L12 2l2.09 6.73 6.91.51-5.46 4.95 1.64 6.81z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  )
}

// Spice level: 0 none, 1 mild, 2 medium, 3 hot
export function SpiceLevel({ level, className }: { level: number; className?: string }) {
  if (!level) return null
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} title={`Spice level: ${level}`}>
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="h-3 w-3 fill-red-500 text-red-500" />
      ))}
    </span>
  )
}

// Bestseller ribbon
export function BestSellerTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700',
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-amber-500" aria-hidden>
        <path d="M12 17.27l-5.18 3.73 1.64-6.81L3 9.24l6.91-.51L12 2l2.09 6.73 6.91.51-5.46 4.95 1.64 6.81z" />
      </svg>
      Bestseller
    </span>
  )
}
