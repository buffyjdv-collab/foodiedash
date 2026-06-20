'use client'

import { Star, Clock, IndianRupee, BadgePercent, MapPin, Navigation } from 'lucide-react'
import { Restaurant } from '@/lib/types'
import { useFoodStore } from '@/lib/store'
import { formatRating, formatCount, priceLevelLabel, formatINR } from '@/lib/format'
import { formatDistance } from '@/lib/geo'
import { cn } from '@/lib/utils'

export function RestaurantCard({ restaurant, index = 0 }: { restaurant: Restaurant; index?: number }) {
  const openRestaurant = useFoodStore((s) => s.openRestaurant)
  const hasDistance = restaurant.distance != null && restaurant.distance >= 0

  return (
    <button
      onClick={() => openRestaurant(restaurant.slug)}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Distance badge (precision GPS) */}
        {hasDistance && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm backdrop-blur">
            <Navigation className="h-3 w-3" />
            {formatDistance(restaurant.distance!)} away
          </span>
        )}

        {/* Promoted badge (shifts right if distance badge present) */}
        {restaurant.isPromoted && (
          <span className={cn(
            'absolute top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur',
            hasDistance ? 'right-2' : 'left-2'
          )}>
            Promoted
          </span>
        )}

        {/* Pure Veg badge */}
        {restaurant.isPureVeg && (
          <span className="absolute bottom-2 right-2 rounded-md bg-green-600/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
            Pure Veg
          </span>
        )}

        {/* Offer */}
        {restaurant.offer && (
          <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-bold text-foreground shadow">
              <BadgePercent className="h-3.5 w-3.5 text-primary" />
              {restaurant.offer}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-bold leading-tight text-foreground">{restaurant.name}</h3>
          <span
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold text-white',
              restaurant.rating >= 4.0 ? 'bg-green-700' : restaurant.rating >= 3.5 ? 'bg-amber-500' : 'bg-red-500'
            )}
          >
            <Star className="h-3 w-3 fill-current" />
            {formatRating(restaurant.rating)}
          </span>
        </div>

        <p className="line-clamp-1 text-sm text-muted-foreground">{restaurant.cuisine.split(',').join(' • ')}</p>

        {hasDistance && (
          <p className="flex items-center gap-1 text-xs text-primary">
            <MapPin className="h-3 w-3" />
            {formatDistance(restaurant.distance!)} from you
          </p>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-dashed border-border pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Clock className="h-3.5 w-3.5" />
            {restaurant.deliveryTime} min
          </span>
          <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
            <IndianRupee className="h-3 w-3" />
            {restaurant.costForTwo} for two
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            {restaurant.deliveryFee === 0 ? (
              <span className="text-green-600">FREE Delivery</span>
            ) : (
              <>
                <IndianRupee className="h-3 w-3" />
                {restaurant.deliveryFee}
              </>
            )}
          </span>
        </div>
      </div>
    </button>
  )
}
