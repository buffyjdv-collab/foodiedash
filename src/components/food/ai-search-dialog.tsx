'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
  RotateCcw,
  Plus,
  UtensilsCrossed,
  X,
  Check,
} from 'lucide-react'

import type { MenuItem, Restaurant, CartItem } from '@/lib/types'
import { useFoodStore } from '@/lib/store'
import { formatINR } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { VegDot, RatingBadge } from '@/components/food/shared'

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface SearchMenuItem extends MenuItem {
  restaurant: Restaurant | null
}

interface SearchResponse {
  success: boolean
  items?: SearchMenuItem[]
  aiExplanation?: string
  error?: string
}

interface AISearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SUGGESTION_CHIPS = [
  { label: 'Quick breakfast', emoji: '🍳' },
  { label: 'Late night craving', emoji: '🌙' },
  { label: 'Protein packed', emoji: '💪' },
  { label: 'Comfort food', emoji: '🍲' },
  { label: 'Sweet tooth', emoji: '🍰' },
]

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function AISearchDialog({ open, onOpenChange }: AISearchDialogProps) {
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<SearchMenuItem[] | null>(null)
  const [explanation, setExplanation] = React.useState<string>('')
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set())
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addToCart = useFoodStore((s) => s.addToCart)

  // Focus the input when opened and reset state when closed.
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    } else {
      // Light reset on close so reopening shows the empty state cleanly.
      const t = setTimeout(() => {
        setResults(null)
        setExplanation('')
        setError(null)
        setQuery('')
        setAddedIds(new Set())
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const runSearch = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setLoading(true)
      setError(null)
      setResults(null)
      setExplanation('')
      setAddedIds(new Set())

      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
        })
        const data: SearchResponse = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Search failed. Please try again.')
        }
        setResults(data.items ?? [])
        setExplanation(data.aiExplanation ?? '')
      } catch (err: any) {
        setError(err?.message || 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [loading]
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query)
  }

  const handleChip = (label: string) => {
    setQuery(label)
    runSearch(label)
  }

  const handleAdd = (item: SearchMenuItem) => {
    const restaurant = item.restaurant
    if (!restaurant) {
      toast.error("Couldn't add this item — missing restaurant info.")
      return
    }

    const cartItem: CartItem = {
      uid: `${item.id}-default`,
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
      total: item.price * 1,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    }
    addToCart(cartItem)
    setAddedIds((prev) => new Set(prev).add(item.id))
    toast.success(`${item.name} added to cart`, {
      description: `From ${restaurant.name}`,
    })
  }

  const hasResults = results !== null
  const isEmptyState = !loading && !error && !hasResults

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88dvh] max-h-[88dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl sm:rounded-2xl">
        {/* Header (search bar + suggestions) */}
        <div className="bg-primary text-primary-foreground px-5 pt-5 pb-4">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="size-5" />
              AI Smart Search
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              Describe what you're craving and let AI find the perfect dish.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-4">
            <div className="bg-background text-foreground flex items-center gap-2 rounded-2xl px-3 py-2 shadow-sm">
              <Search className="text-muted-foreground size-5 shrink-0" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe what you're craving... e.g. 'spicy cheesy pizza under 300'"
                aria-label="AI search query"
                className="h-9 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="text-muted-foreground hover:text-foreground shrink-0 rounded-full p-1 transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!query.trim() || loading}
                className="h-8 shrink-0 gap-1.5 rounded-xl px-3"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                <span className="hidden sm:inline">Search</span>
              </Button>
            </div>
          </form>

          {/* Suggestion chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChip(chip.label)}
                disabled={loading}
                className="bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground disabled:opacity-50 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <span aria-hidden>{chip.emoji}</span>
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1">
          <div className="bg-muted/30 min-h-full p-4 sm:p-5">
            <AnimatePresence mode="wait">
              {/* Empty state */}
              {isEmptyState && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col items-center justify-center px-6 py-16 text-center"
                >
                  <div className="bg-primary/10 text-primary mb-4 flex size-20 items-center justify-center rounded-2xl">
                    <UtensilsCrossed className="size-10" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    Tell me what you're in the mood for!
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    Try things like “spicy cheesy pizza under 300”, “healthy
                    salad for lunch”, or “chocolate dessert for two”.
                  </p>
                </motion.div>
              )}

              {/* Loading state */}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <Skeleton className="bg-primary/10 h-14 w-full rounded-2xl" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="bg-card h-28 w-full rounded-2xl"
                    />
                  ))}
                </motion.div>
              )}

              {/* Error state */}
              {error && !loading && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col items-center justify-center px-6 py-12 text-center"
                >
                  <div className="bg-destructive/10 text-destructive mb-4 flex size-16 items-center justify-center rounded-2xl">
                    <AlertCircle className="size-8" />
                  </div>
                  <h3 className="text-base font-semibold">Search failed</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    {error}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSearch(query)}
                    className="mt-4 gap-1.5"
                  >
                    <RotateCcw className="size-4" />
                    Try again
                  </Button>
                </motion.div>
              )}

              {/* Results */}
              {hasResults && !loading && !error && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {/* AI explanation banner */}
                  {explanation && (
                    <div className="border-primary/30 bg-primary/10 text-foreground flex items-start gap-3 rounded-2xl border p-3">
                      <Sparkles className="text-primary mt-0.5 size-5 shrink-0" />
                      <div>
                        <div className="text-primary text-[11px] font-semibold uppercase tracking-wide">
                          Foodie AI says
                        </div>
                        <p className="text-sm leading-relaxed">{explanation}</p>
                      </div>
                    </div>
                  )}

                  {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                      <div className="bg-muted text-muted-foreground mb-4 flex size-16 items-center justify-center rounded-2xl">
                        <UtensilsCrossed className="size-8" />
                      </div>
                      <h3 className="text-base font-semibold">No matches found</h3>
                      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                        Try a different craving — maybe “something cheesy” or
                        “light and healthy”?
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-muted-foreground px-1 text-xs font-medium">
                        {results.length} {results.length === 1 ? 'match' : 'matches'} found
                      </div>
                      <div className="space-y-3">
                        {results.map((item, i) => (
                          <ResultCard
                            key={item.id}
                            item={item}
                            added={addedIds.has(item.id)}
                            onAdd={() => handleAdd(item)}
                            index={i}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Result card                                                        */
/* ------------------------------------------------------------------ */

function ResultCard({
  item,
  added,
  onAdd,
  index,
}: {
  item: SearchMenuItem
  added: boolean
  onAdd: () => void
  index: number
}) {
  const restaurant = item.restaurant
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.3) }}
      className="bg-card flex gap-3 rounded-2xl border p-3 shadow-sm"
    >
      {/* Image */}
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <UtensilsCrossed className="size-8" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <VegDot isVeg={item.isVeg} className="bg-background/90 backdrop-blur" />
        </div>
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-1 text-sm font-semibold leading-tight">
            {item.name}
          </h4>
          {item.isBestSeller && (
            <span className="bg-amber-100 text-amber-700 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              Bestseller
            </span>
          )}
        </div>

        {restaurant && (
          <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
            <span className="line-clamp-1">{restaurant.name}</span>
            {restaurant.rating > 0 && (
              <>
                <span aria-hidden>·</span>
                <RatingBadge rating={restaurant.rating} />
              </>
            )}
          </div>
        )}

        {item.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="text-sm font-bold">{formatINR(item.price)}</div>
          <Button
            type="button"
            size="sm"
            variant={added ? 'secondary' : 'default'}
            onClick={onAdd}
            disabled={!restaurant}
            className="h-8 gap-1.5 rounded-lg px-3 text-xs font-bold uppercase tracking-wide"
          >
            {added ? (
                <>
                  <Check className="size-4" /> Added
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Add
                </>
              )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default AISearchDialog
