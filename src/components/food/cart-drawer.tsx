'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Plus, Minus, Trash2, ShoppingBag, Tag, X, ChevronRight, UtensilsCrossed } from 'lucide-react'
import { useFoodStore, cartItemsTotal } from '@/lib/store'
import { formatINR } from '@/lib/format'
import { VegDot, SpiceLevel } from './shared'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CartDrawer() {
  const open = useFoodStore((s) => s.cartOpen)
  const setOpen = useFoodStore((s) => s.setCartOpen)
  const cart = useFoodStore((s) => s.cart)
  const cartRestaurantName = useFoodStore((s) => s.cartRestaurantName)
  const updateQuantity = useFoodStore((s) => s.updateQuantity)
  const removeFromCart = useFoodStore((s) => s.removeFromCart)
  const clearCart = useFoodStore((s) => s.clearCart)
  const setView = useFoodStore((s) => s.setView)
  const itemsTotal = useFoodStore(cartItemsTotal)
  const appliedCoupon = useFoodStore((s) => s.appliedCoupon)
  const setAppliedCoupon = useFoodStore((s) => s.setAppliedCoupon)

  const [couponInput, setCouponInput] = useState('')
  const [coupons, setCoupons] = useState<{ code: string; description: string; minOrder: number }[]>([])

  useEffect(() => {
    fetch('/api/coupons').then((r) => r.json()).then((d) => setCoupons(d.coupons || []))
  }, [])

  const deliveryFee = cart.length > 0 ? 25 : 0
  const taxes = Math.floor(itemsTotal * 0.05)
  const discount = appliedCoupon?.discount || 0
  const total = itemsTotal + deliveryFee + taxes - discount

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: itemsTotal }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Invalid coupon')
        setAppliedCoupon(null)
        return
      }
      setAppliedCoupon({ code: data.coupon.code, discount: data.discount })
      toast.success(`Coupon ${data.coupon.code} applied! You saved ${formatINR(data.discount)}`)
      setCouponInput('')
    } catch {
      toast.error('Failed to apply coupon')
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    setOpen(false)
    setView('checkout')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Cart
          </SheetTitle>
          {cartRestaurantName && (
            <p className="text-sm text-muted-foreground">From <span className="font-semibold text-foreground">{cartRestaurantName}</span></p>
          )}
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">Add some delicious food to get started!</p>
            <Button onClick={() => { setOpen(false); setView('home') }} className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Browse Restaurants
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="space-y-3 p-4">
                {cart.map((item) => (
                  <div key={item.uid} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">🍽️</div>
                    )}
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <VegDot isVeg={item.isVeg} />
                        <SpiceLevel level={item.spiceLevel} />
                        <h4 className="line-clamp-1 flex-1 text-sm font-bold">{item.name}</h4>
                      </div>
                      {item.selectedVariants.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.selectedVariants.map((v) => v.optionName).join(', ')}
                        </p>
                      )}
                      {item.selectedAddons.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + {item.selectedAddons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-lg border border-border">
                          <button
                            onClick={() => updateQuantity(item.uid, -1)}
                            className="flex h-7 w-7 items-center justify-center text-primary hover:bg-accent"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[16px] text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.uid, 1)}
                            className="flex h-7 w-7 items-center justify-center text-primary hover:bg-accent"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-bold">{formatINR(item.total)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.uid)}
                      className="self-start text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button onClick={() => { clearCart(); toast.success('Cart cleared') }} className="text-xs text-muted-foreground hover:text-destructive">
                  Clear cart
                </button>

                {/* Coupons */}
                <div className="rounded-xl border border-dashed border-border p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <Tag className="h-4 w-4 text-primary" /> Coupons & Offers
                  </div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                      <div>
                        <div className="text-sm font-bold text-green-700">{appliedCoupon.code} applied</div>
                        <div className="text-xs text-green-600">You saved {formatINR(appliedCoupon.discount)}</div>
                      </div>
                      <button onClick={() => { setAppliedCoupon(null); toast.info('Coupon removed') }} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="uppercase"
                        />
                        <Button
                          variant="outline"
                          onClick={() => applyCoupon(couponInput)}
                          disabled={!couponInput}
                          className="shrink-0"
                        >
                          Apply
                        </Button>
                      </div>
                      <div className="mt-2 space-y-1">
                        {coupons.slice(0, 3).map((c) => (
                          <button
                            key={c.code}
                            onClick={() => applyCoupon(c.code)}
                            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-xs transition hover:border-primary"
                          >
                            <span className="font-semibold text-primary">{c.code}</span>
                            <span className="line-clamp-1 text-muted-foreground">{c.description}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Bill details */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <h4 className="mb-2 text-sm font-bold">Bill Details</h4>
                  <div className="space-y-1.5 text-sm">
                    <Row label="Item Total" value={formatINR(itemsTotal)} />
                    <Row label="Delivery Fee" value={deliveryFee === 0 ? 'FREE' : formatINR(deliveryFee)} />
                    <Row label="Taxes & Charges (5%)" value={formatINR(taxes)} />
                    {discount > 0 && (
                      <Row label="Discount" value={`- ${formatINR(discount)}`} highlight />
                    )}
                  </div>
                  <Separator className="my-2" />
                  <Row label="To Pay" value={formatINR(total)} bold />
                </div>
              </div>
            </ScrollArea>

            {/* Checkout bar */}
            <div className="border-t border-border p-4">
              <Button
                onClick={handleCheckout}
                className="flex h-12 w-full items-center justify-between bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                <span className="font-bold">{formatINR(total)}</span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  Proceed to Checkout <ChevronRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between', bold && 'text-base font-extrabold', highlight && 'text-green-600')}>
      <span className={cn(!bold && 'text-muted-foreground')}>{label}</span>
      <span className={cn(bold ? 'font-extrabold' : 'font-medium', highlight && 'font-semibold')}>{value}</span>
    </div>
  )
}
