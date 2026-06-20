'use client'

import { useEffect, useRef } from 'react'
import { FoodCategory } from '@/lib/types'

export function CategoryCarousel({ categories, onSelect }: { categories: FoodCategory[]; onSelect: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-2 sm:gap-4"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="group flex min-w-[88px] flex-col items-center gap-2 sm:min-w-[104px]"
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl shadow-sm transition-transform group-hover:-translate-y-1 group-hover:shadow-md sm:h-24 sm:w-24 sm:text-4xl"
              style={{ backgroundColor: cat.color + '22' }}
            >
              <span>{cat.emoji}</span>
            </div>
            <span className="text-center text-xs font-semibold text-foreground sm:text-sm">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
