'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Phone,
  Mail,
  Wallet,
  Plus,
  Star,
  MapPin,
  Home,
  ShoppingBag,
  Heart,
  LifeBuoy,
  Settings,
  ChevronRight,
  Pencil,
  Crown,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useFoodStore } from '@/lib/store'
import { formatINR } from '@/lib/format'

// ---------------------------------------------------------------------------
// Types (mirror of the API payload)
// ---------------------------------------------------------------------------

interface AddressDTO {
  id: string
  label: string
  fullAddress: string
  landmark: string | null
}

interface CustomerDTO {
  id: string
  name: string
  email: string
  phone: string
  walletBalance: number
  loyaltyPoints: number
  addresses: AddressDTO[]
}

// ---------------------------------------------------------------------------
// Loyalty tier helpers
// ---------------------------------------------------------------------------

const TIER_THRESHOLDS = [
  { name: 'Silver', min: 0 },
  { name: 'Gold', min: 500 },
  { name: 'Platinum', min: 1500 },
] as const

function tierFor(points: number) {
  let current = TIER_THRESHOLDS[0]
  let next: (typeof TIER_THRESHOLDS)[number] | null = TIER_THRESHOLDS[1] ?? null
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (points >= TIER_THRESHOLDS[i].min) {
      current = TIER_THRESHOLDS[i]
      next = TIER_THRESHOLDS[i + 1] ?? null
    }
  }
  return { current, next }
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((n) => n[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Profile() {
  const [customer, setCustomer] = useState<CustomerDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const setView = useFoodStore((s) => s.setView)

  useEffect(() => {
    let mounted = true
    fetch('/api/customer')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        if (data.success) {
          setCustomer(data.customer as CustomerDTO)
        } else {
          setError(data.error || 'Failed to load profile')
        }
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load profile')
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  // ---- loading ----
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  // ---- error ----
  if (error || !customer) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-muted-foreground max-w-sm">
            {error || 'Profile not available right now.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const { current, next } = tierFor(customer.loyaltyPoints)
  const progressPct = next
    ? Math.min(
        100,
        ((customer.loyaltyPoints - current.min) / (next.min - current.min)) *
          100
      )
    : 100
  const pointsToNext = next ? Math.max(0, next.min - customer.loyaltyPoints) : 0

  const quickLinks: {
    label: string
    icon: LucideIcon
    action: () => void
  }[] = [
    {
      label: 'My Orders',
      icon: ShoppingBag,
      action: () => setView('orders'),
    },
    {
      label: 'Saved Restaurants',
      icon: Heart,
      action: () => toast.info('Saved restaurants coming soon'),
    },
    {
      label: 'Help & Support',
      icon: LifeBuoy,
      action: () => toast.info('Help & support coming soon'),
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => toast.info('Settings coming soon'),
    },
  ]

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {/* -------------------------------------------------------------- */}
      {/* Profile header                                                 */}
      {/* -------------------------------------------------------------- */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 },
        }}
      >
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold truncate">{customer.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  <Crown className="h-3 w-3" /> {current.name}
                </span>
              </div>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </span>
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5" />
                  {customer.email}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Edit profile coming soon')}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Wallet + Loyalty                                               */}
      {/* -------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wallet card with orange gradient */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="relative overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-md bg-gradient-to-br from-primary to-orange-600 h-full">
            {/* decorative circles */}
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-white/10"
              aria-hidden
            />
            <div className="relative">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-90">
                <Wallet className="h-3.5 w-3.5" /> Swiggy Wallet
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {formatINR(customer.walletBalance)}
              </p>
              <p className="text-xs opacity-80 mt-1">Available balance</p>
              <Button
                size="sm"
                className="mt-4 bg-white/20 text-white hover:bg-white/30 backdrop-blur"
                onClick={() => toast.info('Add money coming soon')}
              >
                <Plus className="h-3.5 w-3.5" /> Add Money
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Loyalty card */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Card className="rounded-2xl h-full">
            <CardContent className="p-5 h-full flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  Loyalty Points
                </p>
                {next && (
                  <span className="text-xs text-muted-foreground">
                    {pointsToNext} pts to{' '}
                    <span className="font-semibold text-foreground">
                      {next.name}
                    </span>
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold tabular-nums">
                {customer.loyaltyPoints.toLocaleString('en-IN')}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  pts
                </span>
              </p>
              <Progress value={progressPct} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {next
                  ? `${customer.loyaltyPoints} / ${next.min} pts to ${next.name} tier`
                  : `You're in our top ${current.name} tier — enjoy!`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Saved addresses                                               */}
      {/* -------------------------------------------------------------- */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 },
        }}
      >
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Saved Addresses
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toast.info('Add address coming soon')}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {customer.addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No saved addresses yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => toast.info('Add address coming soon')}
                >
                  <Plus className="h-3.5 w-3.5" /> Add address
                </Button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {customer.addresses.map((addr) => (
                  <li
                    key={addr.id}
                    className="flex items-start gap-3 rounded-xl border bg-card p-3"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{addr.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {addr.fullAddress}
                      </p>
                      {addr.landmark && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Landmark: {addr.landmark}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* -------------------------------------------------------------- */}
      {/* Quick links                                                    */}
      {/* -------------------------------------------------------------- */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 },
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((q) => {
            const Icon = q.icon
            return (
              <button
                key={q.label}
                type="button"
                onClick={q.action}
                className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm hover:shadow-md hover:border-primary/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 transition group-hover:bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">{q.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
