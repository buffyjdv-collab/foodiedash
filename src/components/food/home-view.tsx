'use client'

import { useEffect, useState, useCallback } from 'react'
import { Restaurant, FoodCategory } from '@/lib/types'
import { RestaurantCard } from './restaurant-card'
import { CategoryCarousel } from './category-carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Star, Clock, Leaf, Zap, SlidersHorizontal, Utensils, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'relevance' | 'rating' | 'deliveryTime' | 'costLow' | 'costHigh'

export function HomeView() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('relevance')
  const [veg, setVeg] = useState(false)
  const [fast, setFast] = useState(false)
  const [rating4, setRating4] = useState(false)
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null)

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (activeCuisine) params.set('cuisine', activeCuisine)
    if (veg) params.set('veg', 'true')
    if (fast) params.set('fast', 'true')
    if (rating4) params.set('rating4', 'true')
    params.set('sort', sort)
    const res = await fetch(`/api/restaurants?${params.toString()}`)
    const data = await res.json()
    setRestaurants(data.restaurants || [])
    setLoading(false)
  }, [search, activeCuisine, veg, fast, rating4, sort])

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories || []))
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchRestaurants, 250)
    return () => clearTimeout(t)
  }, [fetchRestaurants])

  const toggleCuisine = (id: string) => setActiveCuisine((c) => (c === id ? null : id))

  const filters = [
    { key: 'sort', label: 'Filters', icon: SlidersHorizontal, isSort: true },
    { key: 'fast', label: 'Fast Delivery', icon: Zap, active: fast, toggle: () => setFast((v) => !v) },
    { key: 'rating4', label: 'Rating 4.0+', icon: Star, active: rating4, toggle: () => setRating4((v) => !v) },
    { key: 'veg', label: 'Pure Veg', icon: Leaf, active: veg, toggle: () => setVeg((v) => !v) },
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      {/* Hero banner */}
      <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-orange-500 to-amber-500 p-6 text-white shadow-lg sm:p-10">
        <div className="relative z-10 max-w-xl">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered food discovery
          </span>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            Late night cravings?<br />We&apos;ve got you covered.
          </h1>
          <p className="mt-3 text-sm text-white/90 sm:text-base">
            Order from your favourite restaurants. Get it delivered in 30 minutes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur">
              <div className="text-2xl font-extrabold">12+</div>
              <div className="text-xs text-white/80">Restaurants</div>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur">
              <div className="text-2xl font-extrabold">30 min</div>
              <div className="text-xs text-white/80">Avg delivery</div>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-2 backdrop-blur">
              <div className="text-2xl font-extrabold">4.5★</div>
              <div className="text-xs text-white/80">Avg rating</div>
            </div>
          </div>
        </div>
        {/* decorative food emojis */}
        <div className="pointer-events-none absolute right-4 top-4 hidden text-7xl opacity-20 sm:block lg:right-12 lg:text-9xl">
          🍔
        </div>
        <div className="pointer-events-none absolute bottom-2 right-24 hidden text-5xl opacity-20 sm:block lg:right-32 lg:text-7xl">
          🍕
        </div>
      </section>

      {/* Categories */}
      <section className="mb-7">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold text-foreground">
          <Utensils className="h-5 w-5 text-primary" />
          Eat what makes you happy
        </h2>
        <CategoryCarousel categories={categories} onSelect={toggleCuisine} />
      </section>

      {/* Active cuisine chip */}
      {activeCuisine && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Showing:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary capitalize">
            {categories.find((c) => c.id === activeCuisine)?.name || activeCuisine}
            <button onClick={() => setActiveCuisine(null)} className="ml-1 rounded-full hover:bg-primary/20">×</button>
          </span>
        </div>
      )}

      {/* Filters */}
      <section className="sticky top-16 z-30 -mx-4 mb-5 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {/* Sort dropdown */}
          <SortDropdown sort={sort} setSort={setSort} />
          {filters.slice(1).map((f) => (
            <Button
              key={f.key}
              variant={f.active ? 'default' : 'outline'}
              size="sm"
              onClick={f.toggle}
              className={cn(
                'shrink-0 rounded-full',
                f.active ? 'bg-primary text-primary-foreground' : ''
              )}
            >
              <f.icon className="h-3.5 w-3.5" />
              {f.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Restaurants */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-foreground">
            {loading ? 'Loading restaurants…' : `${restaurants.length} restaurants near you`}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border">
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="mb-3 text-5xl">🔍</div>
            <h3 className="text-lg font-bold">No restaurants found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try changing filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurants.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SortDropdown({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const options: { key: SortKey; label: string }[] = [
    { key: 'relevance', label: 'Relevance' },
    { key: 'rating', label: 'Rating: High to Low' },
    { key: 'deliveryTime', label: 'Delivery Time' },
    { key: 'costLow', label: 'Cost: Low to High' },
    { key: 'costHigh', label: 'Cost: High to Low' },
  ]
  const current = options.find((o) => o.key === sort)
  return (
    <div className="relative shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {current?.label || 'Sort'}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
            {options.map((o) => (
              <button
                key={o.key}
                onClick={() => {
                  setSort(o.key)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-accent',
                  o.key === sort && 'bg-accent font-semibold text-primary'
                )}
              >
                {o.label}
                {o.key === sort && <span className="text-primary">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
