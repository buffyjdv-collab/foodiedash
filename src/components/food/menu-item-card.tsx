'use client'

import { useState } from 'react'
import { Plus, Minus, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MenuItem, Variant, Addon, CartItem } from '@/lib/types'
import { useFoodStore } from '@/lib/store'
import { parseJSON, formatINR } from '@/lib/format'
import { VegDot, SpiceLevel, BestSellerTag, RatingBadge } from './shared'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function MenuItemCard({ item, restaurantId, restaurantName }: { item: MenuItem; restaurantId: string; restaurantName: string }) {
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const cart = useFoodStore((s) => s.cart)
  const addToCart = useFoodStore((s) => s.addToCart)
  const updateQuantity = useFoodStore((s) => s.updateQuantity)
  const setCartOpen = useFoodStore((s) => s.setCartOpen)

  const variants = parseJSON<Variant[]>(item.variants)
  const addons = parseJSON<Addon[]>(item.addons)
  const hasCustomization = (variants && variants.length > 0) || (addons && addons.length > 0)

  // Find the default cart entry (no customization) quantity
  const defaultUid = `${item.id}-default`
  const inCart = cart.find((c) => c.uid === defaultUid)
  const qty = inCart?.quantity || 0

  const handleQuickAdd = () => {
    if (hasCustomization) {
      setCustomizeOpen(true)
      return
    }
    const cartItem: CartItem = {
      uid: defaultUid,
      menuItemId: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: item.price,
      quantity: 1,
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel,
      selectedVariants: [],
      selectedAddons: [],
      unitPrice: item.price,
      total: item.price,
      restaurantId,
      restaurantName,
    }
    addToCart(cartItem)
    toast.success(`${item.name} added to cart`)
  }

  return (
    <>
      <div className="flex gap-3 border-b border-border py-5 last:border-b-0 sm:gap-4">
        {/* Text */}
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <VegDot isVeg={item.isVeg} />
            {item.isBestSeller && <BestSellerTag />}
            {item.isRecommended && (
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                Must Try
              </span>
            )}
          </div>
          <h3 className="mt-1 text-base font-bold leading-tight text-foreground">{item.name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{formatINR(item.price)}</span>
            {item.rating > 0 && (
              <RatingBadge rating={item.rating} />
            )}
            <SpiceLevel level={item.spiceLevel} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        </div>

        {/* Image + Add button */}
        <div className="relative w-28 shrink-0 sm:w-32">
          {item.imageUrl ? (
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-muted text-3xl">
              🍽️
            </div>
          )}

          {/* Add / quantity control */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            {qty === 0 ? (
              <Button
                onClick={handleQuickAdd}
                size="sm"
                className="h-8 min-w-[72px] rounded-lg border border-primary bg-white px-3 text-sm font-bold text-primary shadow-md hover:bg-primary hover:text-primary-foreground"
              >
                {hasCustomization ? 'CUSTOMISE' : 'ADD'}
                {!hasCustomization && <Plus className="h-3.5 w-3.5" />}
              </Button>
            ) : (
              <div className="flex h-8 items-center gap-2 rounded-lg border border-primary bg-white px-1 shadow-md">
                <button
                  onClick={() => updateQuantity(defaultUid, -1)}
                  className="flex h-6 w-6 items-center justify-center rounded text-primary hover:bg-primary/10"
                  aria-label="Decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[16px] text-center text-sm font-bold text-primary">{qty}</span>
                <button
                  onClick={() => hasCustomization ? setCustomizeOpen(true) : updateQuantity(defaultUid, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded text-primary hover:bg-primary/10"
                  aria-label="Increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasCustomization && (
        <CustomizeDialog
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          item={item}
          variants={variants || []}
          addons={addons || []}
          restaurantId={restaurantId}
          restaurantName={restaurantName}
        />
      )}
    </>
  )
}

interface CustomizeDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  item: MenuItem
  variants: Variant[]
  addons: Addon[]
  restaurantId: string
  restaurantName: string
}

function CustomizeDialog({ open, onOpenChange, item, variants, addons, restaurantId, restaurantName }: CustomizeDialogProps) {
  const addToCart = useFoodStore((s) => s.addToCart)
  // selected variant option per group (default first option of each group)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    variants.forEach((v) => {
      if (v.options.length > 0) init[v.name] = v.options[0].name
    })
    return init
  })
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({})
  const [qty, setQty] = useState(1)

  const variantExtras = variants.reduce((sum, v) => {
    const optName = selectedVariants[v.name]
    const opt = v.options.find((o) => o.name === optName)
    return sum + (opt?.price || 0)
  }, 0)
  const addonExtras = addons.reduce((sum, a) => {
    return sum + (selectedAddons[a.name] ? a.price : 0)
  }, 0)
  const unitPrice = item.price + variantExtras + addonExtras
  const total = unitPrice * qty

  const handleAdd = () => {
    const variantArr = variants.map((v) => {
      const optName = selectedVariants[v.name]
      const opt = v.options.find((o) => o.name === optName)!
      return { groupName: v.name, optionName: opt.name, price: opt.price }
    })
    const addonArr = addons.filter((a) => selectedAddons[a.name]).map((a) => ({ name: a.name, price: a.price }))
    const uid = `${item.id}-${JSON.stringify(variantArr)}-${JSON.stringify(addonArr)}`
    addToCart({
      uid,
      menuItemId: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: item.price,
      quantity: qty,
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel,
      selectedVariants: variantArr,
      selectedAddons: addonArr,
      unitPrice,
      total,
      restaurantId,
      restaurantName,
    })
    toast.success(`${item.name} (customised) added to cart`)
    onOpenChange(false)
    setQty(1)
    setSelectedAddons({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-4">
          <div className="flex items-center gap-2">
            <VegDot isVeg={item.isVeg} />
            {item.isBestSeller && <BestSellerTag />}
          </div>
          <DialogTitle className="text-lg font-bold">{item.name}</DialogTitle>
          <DialogDescription className="text-sm">{item.description}</DialogDescription>
          <div className="mt-1 text-sm font-semibold text-foreground">{formatINR(item.price)}</div>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh]">
          <div className="space-y-4 p-4">
            {/* Variants */}
            {variants.map((v) => (
              <div key={v.name}>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{v.name}</h4>
                  <span className="text-xs font-semibold text-red-500">Required</span>
                </div>
                <RadioGroup
                  value={selectedVariants[v.name]}
                  onValueChange={(val) => setSelectedVariants((p) => ({ ...p, [v.name]: val }))}
                  className="gap-1"
                >
                  {v.options.map((opt) => (
                    <Label
                      key={opt.name}
                      htmlFor={`${v.name}-${opt.name}`}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition hover:bg-accent',
                        selectedVariants[v.name] === opt.name && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={opt.name} id={`${v.name}-${opt.name}`} />
                        <span className="text-sm font-medium">{opt.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {opt.price === 0 ? 'Included' : `+ ${formatINR(opt.price)}`}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ))}

            {/* Addons */}
            {addons.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Add-ons <span className="font-normal text-muted-foreground/70">(optional)</span>
                </h4>
                <div className="space-y-1">
                  {addons.map((a) => (
                    <Label
                      key={a.name}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition hover:bg-accent',
                        selectedAddons[a.name] && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={!!selectedAddons[a.name]}
                          onCheckedChange={(c) => setSelectedAddons((p) => ({ ...p, [a.name]: !!c }))}
                        />
                        <span className="text-sm font-medium">{a.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">+ {formatINR(a.price)}</span>
                    </Label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border p-4">
          <div className="flex h-9 items-center gap-3 rounded-lg border border-border">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-full w-9 items-center justify-center text-primary hover:bg-accent"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[20px] text-center font-bold">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex h-full w-9 items-center justify-center text-primary hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            Add to Cart • {formatINR(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
