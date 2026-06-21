'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Star, Loader2, MessageSquare, Send } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface FeedbackDialogProps {
  orderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitted?: () => void
}

interface RatingRow {
  key: 'food' | 'restaurant' | 'delivery'
  label: string
  emoji: string
  value: number
  setValue: (n: number) => void
  hover: number
  setHover: (n: number) => void
}

function StarRating({
  value,
  hover,
  onChange,
  onHover,
  groupName,
}: {
  value: number
  hover: number
  onChange: (n: number) => void
  onHover: (n: number) => void
  groupName: string
}) {
  const display = hover || value
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label={`${groupName} rating`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display
        const label = `${star} star${star > 1 ? 's' : ''}`
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={label}
            title={label}
            className={cn(
              'rounded-md p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              'cursor-pointer'
            )}
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(star)
              }
            }}
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                filled
                  ? 'fill-primary text-primary'
                  : 'fill-muted text-muted-foreground/40'
              )}
            />
          </button>
        )
      })}
      <span
        className={cn(
          'ml-2 text-sm font-medium tabular-nums',
          display > 0 ? 'text-foreground' : 'text-muted-foreground'
        )}
        aria-live="polite"
      >
        {display > 0 ? `${display}.0` : '—'}
      </span>
    </div>
  )
}

export function FeedbackDialog({
  orderId,
  open,
  onOpenChange,
  onSubmitted,
}: FeedbackDialogProps) {
  const [foodRating, setFoodRating] = useState(0)
  const [restaurantRating, setRestaurantRating] = useState(0)
  const [deliveryRating, setDeliveryRating] = useState(0)
  const [foodHover, setFoodHover] = useState(0)
  const [restaurantHover, setRestaurantHover] = useState(0)
  const [deliveryHover, setDeliveryHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset form whenever the dialog is closed.
  useEffect(() => {
    if (!open) {
      // Defer reset so it doesn't visually flash before the close animation.
      const t = setTimeout(() => {
        setFoodRating(0)
        setRestaurantRating(0)
        setDeliveryRating(0)
        setFoodHover(0)
        setRestaurantHover(0)
        setDeliveryHover(0)
        setComment('')
      }, 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const rows: RatingRow[] = [
    {
      key: 'food',
      label: 'Food Quality',
      emoji: '🍔',
      value: foodRating,
      setValue: setFoodRating,
      hover: foodHover,
      setHover: setFoodHover,
    },
    {
      key: 'restaurant',
      label: 'Restaurant',
      emoji: '🍽️',
      value: restaurantRating,
      setValue: setRestaurantRating,
      hover: restaurantHover,
      setHover: setRestaurantHover,
    },
    {
      key: 'delivery',
      label: 'Delivery',
      emoji: '🛵',
      value: deliveryRating,
      setValue: setDeliveryRating,
      hover: deliveryHover,
      setHover: setDeliveryHover,
    },
  ]

  const canSubmit =
    foodRating > 0 &&
    restaurantRating > 0 &&
    deliveryRating > 0 &&
    !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodRating,
          restaurantRating,
          deliveryRating,
          comment: comment.trim() || undefined,
        }),
      })
      const payload = await res.json()
      if (res.status === 403) {
        toast.error("You don't have permission to submit feedback")
        return
      }
      if (res.status === 401) {
        toast.error('Please sign in again to submit feedback.')
        return
      }
      if (res.status === 409 || /already/i.test(payload.error || '')) {
        toast.error('Feedback already submitted for this order')
        onOpenChange(false)
        onSubmitted?.()
        return
      }
      if (!payload.success) {
        toast.error(payload.error || 'Failed to submit feedback')
        return
      }
      toast.success('Thanks for your feedback!', {
        description: 'Your ratings help us improve.',
      })
      onOpenChange(false)
      onSubmitted?.()
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to submit feedback'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-primary text-primary" />
            Rate your experience
          </DialogTitle>
          <DialogDescription>
            How was your order? Your feedback helps restaurants and riders
            serve you better.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {row.emoji}
                </span>
                <span className="text-sm font-medium">{row.label}</span>
              </div>
              <StarRating
                value={row.value}
                hover={row.hover}
                onChange={row.setValue}
                onHover={row.setHover}
                groupName={row.label}
              />
            </div>
          ))}

          <div className="space-y-2">
            <label
              htmlFor={`feedback-comment-${orderId}`}
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              Comment
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              id={`feedback-comment-${orderId}`}
              placeholder="Tell us about your experience…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={submitting}
            />
            <p className="text-right text-[11px] text-muted-foreground tabular-nums">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}{' '}
            Submit feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
