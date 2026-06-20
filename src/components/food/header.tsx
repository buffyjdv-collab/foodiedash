'use client'

import { useState } from 'react'
import { Search, ShoppingCart, MapPin, ChevronDown, User, Receipt, Sparkles, UtensilsCrossed, LogOut, ShieldCheck, LogIn, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useFoodStore, cartCount } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import { AISearchDialog } from './ai-search-dialog'
import { toast } from 'sonner'

const LOCATIONS = [
  'MG Road, Bangalore',
  'Indiranagar, Bangalore',
  'Koramangala, Bangalore',
  'HSR Layout, Bangalore',
  'Whitefield, Bangalore',
  'Jayanagar, Bangalore',
]

function initials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

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

  const user = useAuthStore((s) => s.user)
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  const goHome = () => setView('home')

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    setView('home')
  }

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
            <SheetHeader className="p-5 pb-2">
              <SheetTitle className="text-lg font-bold">Choose your location</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">Select a delivery area to see restaurants near you</SheetDescription>
            </SheetHeader>
            <div className="px-5 pb-5">
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
        <button onClick={() => setLocOpen(true)} className="flex min-w-0 items-center gap-1 sm:hidden">
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

          {/* Auth-aware section */}
          {!user ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLoginOpen(true)}
              className="shrink-0 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
              <span className="sm:hidden">Login</span>
            </Button>
          ) : (
            <>
              {/* Admin portal link */}
              {isAdmin() && (
                <Button
                  size="sm"
                  variant={view === 'admin' ? 'default' : 'outline'}
                  onClick={() => setView('admin')}
                  className="shrink-0"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Portal</span>
                  <span className="sm:hidden">Admin</span>
                </Button>
              )}

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-2 transition hover:border-primary hover:bg-accent sm:pr-3">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <div className="max-w-[120px] truncate text-xs font-bold leading-tight">{user.name || 'User'}</div>
                      <div className="text-[10px] leading-tight text-muted-foreground">
                        {user.roleLabels?.[0] || user.roles[0]}
                      </div>
                    </div>
                    <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold">{user.name || 'User'}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.phone}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(user.roleLabels || user.roles).map((r, i) => (
                        <Badge key={r} variant="secondary" className="text-[10px]">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setView('orders')}>
                    <Receipt className="h-4 w-4" /> My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('profile')}>
                    <User className="h-4 w-4" /> Profile & Wallet
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <DropdownMenuItem onClick={() => setView('admin')}>
                      <ShieldCheck className="h-4 w-4" /> Admin Portal
                      <ChevronRight className="ml-auto h-3 w-3" />
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

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
