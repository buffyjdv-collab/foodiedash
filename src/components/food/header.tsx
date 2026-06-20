'use client'

import { useState } from 'react'
import { Search, ShoppingCart, MapPin, ChevronDown, User, Receipt, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useFoodStore, cartCount } from '@/lib/store'
import { cn } from '@/lib/utils'
import { AISearchDialog } from './ai-search-dialog'

const LOCATIONS = [
  'MG Road, Bangalore',
  'Indiranagar, Bangalore',
  'Koramangala, Bangalore',
  'HSR Layout, Bangalore',
  'Whitefield, Bangalore',
  'Jayanagar, Bangalore',
]

export function Header() {
  const [aiSearchOpen, setAiSearchOpen] = useState(false)
  const [locOpen, setLocOpen] = useState(false)
  const count = useFoodStore(cartCount)
  const cartOpen = useFoodStore((s) => s.cartOpen)
  const setCartOpen = useFoodStore((s) => s.setCartOpen)
  const address = useFoodStore((s) => s.address)
  const setAddress = useFoodStore((s) => s.setAddress)
  const view = useFoodStore((s) => s.view)
  const setView = useFoodStore((s) => s.setView)

  const goHome = () => setView('home')

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6">
        {/* Logo */}
        <button onClick={goHome} className="flex shrink-0 items-center gap-2" aria-label="Home">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="hidden text-xl font-extrabold tracking-tight text-foreground sm:block">
            Foodie<span className="text-primary">Dash</span>
          </span>
        </button>

        {/* Location selector */}
        <Sheet open={locOpen} onOpenChange={setLocOpen}>
          <SheetTrigger asChild>
            <button className="group hidden min-w-0 items-center gap-1.5 border-l border-border pl-3 sm:flex">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate text-sm font-semibold text-foreground">{address}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-y-0.5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px]">
            <div className="p-5">
              <h3 className="mb-1 text-lg font-bold">Choose your location</h3>
              <p className="mb-4 text-sm text-muted-foreground">Select a delivery area to see restaurants near you</p>
              <div className="space-y-2">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setAddress(loc)
                      setLocOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition hover:border-primary hover:bg-accent',
                      loc === address && 'border-primary bg-accent'
                    )}
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{loc}</span>
                  </button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile location (compact) */}
        <button
          onClick={() => setLocOpen(true)}
          className="flex min-w-0 items-center gap-1 sm:hidden"
        >
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-xs font-semibold">{address.split(',')[0]}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>

        {/* Search (AI) */}
        <button
          onClick={() => setAiSearchOpen(true)}
          className="group flex flex-1 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/50 hover:bg-white"
        >
          <Search className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Search for restaurants, dishes…</span>
          <span className="sm:hidden">Search</span>
          <span className="ml-auto hidden items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary sm:flex">
            <Sparkles className="h-3 w-3" /> AI
          </span>
        </button>

        {/* Nav actions */}
        <nav className="flex shrink-0 items-center gap-1">
          <Button
            variant={view === 'orders' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('orders')}
            className="hidden sm:flex"
          >
            <Receipt className="h-4 w-4" />
            Orders
          </Button>
          <Button
            variant={view === 'profile' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setView('profile')}
            aria-label="Profile"
            className={view === 'profile' ? '' : 'sm:hidden'}
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('profile')}
            className="hidden sm:flex"
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
          <Button
            size="sm"
            onClick={() => setCartOpen(!cartOpen)}
            className="relative bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center bg-foreground px-1 text-[10px] font-bold text-white">
                {count}
              </Badge>
            )}
          </Button>
        </nav>
      </div>

      <AISearchDialog open={aiSearchOpen} onOpenChange={setAiSearchOpen} />
    </header>
  )
}
