'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ShoppingBag,
  PackageOpen,
  RotateCcw,
  Navigation,
  AlertCircle,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useFoodStore } from '@/lib/store'
import { formatINR, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'

const IN_PROGRESS_STATUSES = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'ASSIGNED',
  'PICKED_UP',
  'ON_ROUTE',
]

function statusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case 'DELIVERED':
      return {
        className: 'bg-green-100 text-green-700 border-green-200',
        label: 'Delivered',
      }
    case 'CANCELLED':
      return {
        className: 'bg-red-100 text-red-700 border-red-200',
        label: 'Cancelled',
      }
    default:
      return {
        className: 'bg-primary/10 text-primary border-primary/20',
        label:
          status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
      }
  }
}

function itemsSummary(items: Order['items']): string {
  if (!items.length) return ''
  const visible = items.slice(0, 2).map((it) => `${it.name} ×${it.quantity}`)
  const remaining = items.length - visible.length
  const head = visible.join(', ')
  if (remaining > 0) return `${head} and ${remaining} more`
  return head
}

export function OrdersList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orders = useFoodStore((s) => s.orders)
  const setOrders = useFoodStore((s) => s.setOrders)
  const goToTracking = useFoodStore((s) => s.goToTracking)
  const setView = useFoodStore((s) => s.setView)

  useEffect(() => {
    let mounted = true
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        if (data.success) {
          setOrders(data.orders as Order[])
        } else {
          setError(data.error || 'Failed to load orders')
        }
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load orders')
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [setOrders])

  // ---- loading skeleton ----
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    )
  }

  // ---- error state ----
  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-muted-foreground max-w-sm">{error}</p>
          <Button variant="outline" onClick={() => setView('home')}>
            Back to home
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ---- empty state ----
  if (!orders.length) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <PackageOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No orders yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Your past orders will show up here. Let&apos;s find something
              delicious!
            </p>
          </div>
          <Button onClick={() => setView('home')}>
            <ShoppingBag className="h-4 w-4" /> Browse restaurants
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ---- list ----
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {orders.map((order) => {
        const badge = statusBadge(order.status)
        const inProgress = IN_PROGRESS_STATUSES.includes(order.status)
        return (
          <motion.div
            key={order.id}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.25 }}
          >
            <Card className="rounded-2xl h-full hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col h-full gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">
                      {order.restaurant?.name ?? 'Restaurant'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.restaurant?.cuisine}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0', badge.className)}
                  >
                    {badge.label}
                  </Badge>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{order.orderCode}</span>
                  <span aria-hidden>·</span>
                  <span>{timeAgo(order.createdAt)}</span>
                  {order.items.length > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>

                {/* Items summary */}
                <p className="text-sm text-foreground line-clamp-2">
                  {itemsSummary(order.items) || '—'}
                </p>

                {/* Footer: total + actions */}
                <div className="mt-auto flex items-center justify-between pt-1">
                  <span className="font-bold tabular-nums">
                    {formatINR(order.total)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        toast.success('Added to cart', {
                          description: 'Browse the restaurant to reorder.',
                        })
                        setView('home')
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reorder
                    </Button>
                    {inProgress && (
                      <Button
                        size="sm"
                        onClick={() => goToTracking(order.id)}
                      >
                        <Navigation className="h-3.5 w-3.5" /> Track
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
