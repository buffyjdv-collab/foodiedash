'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ArrowLeft, MapPin, CreditCard, Wallet, Banknote, Smartphone, Gift, Plus, Loader2, CheckCircle2, BadgePercent, X, ShieldAlert, LogIn } from 'lucide-react'
import { useFoodStore, cartItemsTotal } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Order } from '@/lib/types'

interface AddressItem { id: string; label: string; fullAddress: string; landmark?: string | null }

const PAYMENTS = [
  { id: 'UPI', label: 'UPI', desc: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { id: 'WALLET', label: 'FoodieDash Wallet', desc: 'Pay via wallet balance', icon: Wallet },
  { id: 'COD', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Banknote },
]

const TIPS = [0, 20, 30, 50]

export function CheckoutView() {
  const cart = useFoodStore((s) => s.cart)
  const cartRestaurantId = useFoodStore((s) => s.cartRestaurantId)
  const cartRestaurantName = useFoodStore((s) => s.cartRestaurantName)
  const itemsTotal = useFoodStore(cartItemsTotal)
  const appliedCoupon = useFoodStore((s) => s.appliedCoupon)
  const tip = useFoodStore((s) => s.tip)
  const setTip = useFoodStore((s) => s.setTip)
  const clearCart = useFoodStore((s) => s.clearCart)
  const setView = useFoodStore((s) => s.setView)
  const addOrder = useFoodStore((s) => s.addOrder)
  const goToTracking = useFoodStore((s) => s.goToTracking)
  const user = useAuthStore((s) => s.user)
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen)
  const setCartOpen = useFoodStore((s) => s.setCartOpen)

  const [addresses, setAddresses] = useState<AddressItem[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [payment, setPayment] = useState('UPI')
  const [placing, setPlacing] = useState(false)

  const deliveryFee = 25
  const taxes = Math.floor(itemsTotal * 0.05)
  const discount = appliedCoupon?.discount || 0
  const total = itemsTotal + deliveryFee + taxes - discount + tip

  useEffect(() => {
    fetch('/api/customer')
      .then((r) => r.json())
      .then((d) => {
        const addr = d.customer?.addresses || []
        setAddresses(addr)
        if (addr[0]) setSelectedAddress(addr[0].id)
      })
      .finally(() => setLoadingAddr(false))
  }, [])

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address')
      return
    }
    const addr = addresses.find((a) => a.id === selectedAddress)
    if (!addr) return
    if (!cartRestaurantId) {
      toast.error('Your cart is empty')
      return
    }
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            variants: JSON.stringify(c.selectedVariants),
            addons: JSON.stringify(c.selectedAddons),
            total: c.total,
          })),
          restaurantId: cartRestaurantId,
          addressLine: `${addr.label}: ${addr.fullAddress}${addr.landmark ? ` (${addr.landmark})` : ''}`,
          paymentMethod: payment,
          couponCode: appliedCoupon?.code,
          tip,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please sign in to place your order')
          setLoginOpen(true)
          return
        }
        if (res.status === 403) {
          toast.error(data.error || 'Your role does not allow placing orders')
          return
        }
        throw new Error(data.error || 'Failed to place order')
      }
      const order = data.order as Order
      addOrder(order)
      toast.success('Order placed successfully! 🎉')
      clearCart()
      setPlacing(false)
      goToTracking(order.id)
    } catch (e: any) {
      toast.error(e.message || 'Failed to place order')
      setPlacing(false)
    }
  }

  if (cart.length === 0 && !placing) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-3 text-5xl">🛒</div>
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add items to checkout</p>
        <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setView('home')}>
          Browse Restaurants
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      <button
        onClick={() => setView('home')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-4 text-2xl font-extrabold">Checkout</h1>

      {!user && (
        <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Sign in required to place your order</p>
              <p className="text-xs text-muted-foreground">
                OTP login is enforced by RBAC — the <code className="rounded bg-muted px-1">orders.create</code> permission is needed.
              </p>
            </div>
          </div>
          <Button onClick={() => setLoginOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Left: address + payment */}
        <div className="space-y-5">
          {/* Address */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-primary" /> Delivery Address
            </h2>
            {loadingAddr ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="gap-2">
                {addresses.map((a) => (
                  <Label
                    key={a.id}
                    htmlFor={a.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition hover:bg-accent',
                      selectedAddress === a.id && 'border-primary bg-primary/5'
                    )}
                  >
                    <RadioGroupItem value={a.id} id={a.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-wide text-primary">{a.label}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-foreground">{a.fullAddress}</p>
                      {a.landmark && <p className="text-xs text-muted-foreground">Landmark: {a.landmark}</p>}
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}
            <Button variant="outline" size="sm" className="mt-3 w-full border-dashed" onClick={() => toast.info('Address management coming soon')}>
              <Plus className="h-4 w-4" /> Add new address
            </Button>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </h2>
            <RadioGroup value={payment} onValueChange={setPayment} className="gap-2">
              {PAYMENTS.map((p) => (
                <Label
                  key={p.id}
                  htmlFor={p.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition hover:bg-accent',
                    payment === p.id && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem value={p.id} id={p.id} />
                  <p.icon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.desc}</div>
                  </div>
                  {payment === p.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </Label>
              ))}
            </RadioGroup>
          </section>

          {/* Tip */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
              <Gift className="h-5 w-5 text-primary" /> Tip your delivery partner
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">100% of your tip goes to your delivery partner</p>
            <div className="flex gap-2">
              {TIPS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTip(t)}
                  className={cn(
                    'flex-1 rounded-xl border py-2 text-sm font-bold transition',
                    tip === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                  )}
                >
                  {t === 0 ? 'No Tip' : formatINR(t)}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: order summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-lg font-bold">Order Summary</h2>
            <p className="mb-3 text-sm text-muted-foreground">From <span className="font-semibold text-foreground">{cartRestaurantName}</span></p>

            <div className="max-h-52 space-y-2 overflow-y-auto scroll-thin pr-1">
              {cart.map((item) => (
                <div key={item.uid} className="flex items-start justify-between gap-2 text-sm">
                  <div className="flex flex-1 gap-2">
                    <span className="font-semibold text-muted-foreground">{item.quantity}×</span>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.selectedVariants.length > 0 && (
                        <div className="text-xs text-muted-foreground">{item.selectedVariants.map((v) => v.optionName).join(', ')}</div>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold">{formatINR(item.total)}</span>
                </div>
              ))}
            </div>

            <Separator className="my-3" />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span className="font-medium">{formatINR(itemsTotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span className="font-medium">{formatINR(deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxes (5%)</span><span className="font-medium">{formatINR(taxes)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600"><span className="flex items-center gap-1"><BadgePercent className="h-3.5 w-3.5" /> Discount {appliedCoupon?.code && `(${appliedCoupon.code})`}</span><span className="font-semibold">- {formatINR(discount)}</span></div>
              )}
              {tip > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery Tip</span><span className="font-medium">{formatINR(tip)}</span></div>
              )}
            </div>

            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold">Total</span>
              <span className="text-xl font-extrabold text-primary">{formatINR(total)}</span>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="mt-4 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              {placing ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Placing Order…</>
              ) : (
                <>Place Order • {formatINR(total)}</>
              )}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Safe & secure checkout · Estimated delivery in 30 min
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
