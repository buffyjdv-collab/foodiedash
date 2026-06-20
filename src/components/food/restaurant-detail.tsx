'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { RestaurantDetail, MenuItem } from '@/lib/types'
import { MenuItemCard } from './menu-item-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Star, Clock, IndianRupee, MapPin, Search, ArrowLeft, Share2, Heart, ShoppingCart, BadgePercent, ChevronUp } from 'lucide-react'
import { useFoodStore, cartCount, cartItemsTotal } from '@/lib/store'
import { formatRating, formatCount, formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export function RestaurantDetail({ slug }: { slug: string }) {
  const [data, setData] = useState<RestaurantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuSearch, setMenuSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string>('')
  const [liked, setLiked] = useState(false)
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const setView = useFoodStore((s) => s.setView)
  const count = useFoodStore(cartCount)
  const total = useFoodStore(cartItemsTotal)
  const cartRestaurantId = useFoodStore((s) => s.cartRestaurantId)
  const cartRestaurantName = useFoodStore((s) => s.cartRestaurantName)
  const setCartOpen = useFoodStore((s) => s.setCartOpen)
  const address = useFoodStore((s) => s.address)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/restaurants/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.restaurant || null)
        if (d.restaurant?.menuCategories?.[0]) setActiveCat(d.restaurant.menuCategories[0].id)
      })
      .finally(() => setLoading(false))
  }, [slug])

  // Filtered menu based on search
  const filteredCategories = useMemo(() => {
    if (!data) return []
    if (!menuSearch) return data.menuCategories
    const q = menuSearch.toLowerCase()
    return data.menuCategories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0)
  }, [data, menuSearch])

  // Scroll spy for category nav
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + 200
      for (const cat of data?.menuCategories || []) {
        const el = catRefs.current[cat.id]
        if (el && el.offsetTop <= scrollY) {
          setActiveCat(cat.id)
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [data])

  const scrollToCat = (id: string) => {
    const el = catRefs.current[id]
    if (el) {
      window.scrollTo({ top: el.offsetTop - 180, behavior: 'smooth' })
      setActiveCat(id)
    }
  }

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-20 flex-1" />
              <Skeleton className="h-20 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 text-5xl">😕</div>
        <h2 className="text-xl font-bold">Restaurant not found</h2>
        <Button className="mt-4" onClick={() => setView('home')}>Back to home</Button>
      </div>
    )
  }

  const isCartFromThisRestaurant = cartRestaurantId === data.id

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      {/* Back */}
      <button
        onClick={() => setView('home')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Cover */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="aspect-[21/9] w-full bg-muted">
          <img src={data.coverUrl || data.imageUrl} alt={data.name} className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            onClick={() => setLiked((l) => !l)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow backdrop-blur hover:bg-white"
            aria-label="Save"
          >
            <Heart className={cn('h-4 w-4', liked && 'fill-red-500 text-red-500')} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow backdrop-blur hover:bg-white" aria-label="Share">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Restaurant info card */}
      <div className="relative -mt-10 rounded-2xl border border-border bg-card p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {data.isPureVeg && <Badge className="bg-green-600 text-white">PURE VEG</Badge>}
              {data.isPromoted && <Badge variant="secondary">Promoted</Badge>}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-foreground">{data.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{data.cuisine.split(',').join(' • ')}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {data.address}, {data.city?.name}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 border-l border-dashed border-border pl-4">
            <span
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-white',
                data.rating >= 4.0 ? 'bg-green-700' : data.rating >= 3.5 ? 'bg-amber-500' : 'bg-red-500'
              )}
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              {formatRating(data.rating)}
            </span>
            <span className="text-xs text-muted-foreground">{formatCount(data.ratingCount)} ratings</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-dashed border-border pt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <div className="font-bold text-foreground">{data.deliveryTime} min</div>
              <div className="text-xs text-muted-foreground">Delivery</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-primary" />
            <div>
              <div className="font-bold text-foreground">{formatINR(data.costForTwo)}</div>
              <div className="text-xs text-muted-foreground">for two</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <div className="font-bold text-foreground">{data.deliveryFee === 0 ? 'FREE' : formatINR(data.deliveryFee)}</div>
              <div className="text-xs text-muted-foreground">Delivery fee</div>
            </div>
          </div>
        </div>

        {data.offer && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <BadgePercent className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-bold text-primary">{data.offer}</div>
              <div className="text-xs text-muted-foreground">Use code at checkout</div>
            </div>
          </div>
        )}
      </div>

      {/* Menu search */}
      <div className="sticky top-16 z-30 mt-5 -mx-4 bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="Search within menu…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {menuSearch && (
            <button onClick={() => setMenuSearch('')} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-5">
        {/* Category sidebar (desktop) */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-32 space-y-1">
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => scrollToCat(c.id)}
                className={cn(
                  'block w-full rounded-lg px-3 py-2 text-left text-sm transition',
                  activeCat === c.id
                    ? 'border-l-2 border-primary bg-primary/5 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Menu items */}
        <div className="flex-1">
          {filteredCategories.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No dishes match "{menuSearch}"</div>
          )}
          {filteredCategories.map((cat) => (
            <section
              key={cat.id}
              ref={(el) => { catRefs.current[cat.id] = el }}
              className="mb-6"
            >
              <div className="sticky top-28 z-20 -mx-1 mb-2 flex items-center justify-between rounded-lg bg-background/95 px-3 py-2 backdrop-blur">
                <h2 className="text-lg font-extrabold text-foreground">{cat.name}</h2>
                <span className="text-xs text-muted-foreground">{cat.items.length} items</span>
              </div>
              <div className="rounded-2xl border border-border bg-card px-4">
                {cat.items.map((item: MenuItem) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    restaurantId={data.id}
                    restaurantName={data.name}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Reviews */}
          {!menuSearch && data.reviews.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-extrabold text-foreground">{data.reviews.length} reviews</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.reviews.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded bg-green-700 px-1.5 py-0.5 text-xs font-bold text-white">
                        <Star className="h-3 w-3 fill-current" />{rev.rating}
                      </span>
                      {rev.dish && <span className="text-xs font-medium text-muted-foreground">on {rev.dish}</span>}
                    </div>
                    <p className="mt-2 text-sm text-foreground">{rev.comment}</p>
                    <p className="mt-2 text-xs text-muted-foreground">— {rev.customer?.name || 'Customer'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Floating cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
          <div className="mx-auto max-w-5xl">
            <Button
              onClick={() => setCartOpen(true)}
              className="flex h-14 w-full items-center justify-between rounded-xl bg-primary px-5 text-primary-foreground shadow-2xl hover:bg-primary/90"
              size="lg"
            >
              <span className="flex items-center gap-2 font-bold">
                <ShoppingCart className="h-5 w-5" />
                {count} item{count > 1 ? 's' : ''} • {formatINR(total)}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold">
                {isCartFromThisRestaurant ? 'View Cart' : `From ${cartRestaurantName}`}
                <ChevronUp className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Scroll to top */}
      <button
        onClick={scrollTop}
        className="fixed bottom-20 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-accent"
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  )
}
