'use client'

import { useState } from 'react'
import { MapPin, LocateFixed, Loader2, Navigation, X, Building2, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useFoodStore } from '@/lib/store'
import { nearestAreaLabel, formatCoords, formatAccuracy, type UserLocation } from '@/lib/geo'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const LOCATIONS = [
  { label: 'MG Road, Bangalore', lat: 12.9756, lng: 77.6044 },
  { label: 'Indiranagar, Bangalore', lat: 12.9719, lng: 77.6412 },
  { label: 'Koramangala, Bangalore', lat: 12.9352, lng: 77.6245 },
  { label: 'HSR Layout, Bangalore', lat: 12.9116, lng: 77.6474 },
  { label: 'Whitefield, Bangalore', lat: 12.9698, lng: 77.75 },
  { label: 'Jayanagar, Bangalore', lat: 12.925, lng: 77.5938 },
  { label: 'Banjara Hills, Hyderabad', lat: 17.4126, lng: 78.4396 },
  { label: 'Gachibowli, Hyderabad', lat: 17.4401, lng: 78.3489 },
  { label: 'Hitech City, Hyderabad', lat: 17.4435, lng: 78.3772 },
  { label: 'Madhapur, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { label: 'Secunderabad, Hyderabad', lat: 17.4399, lng: 78.4983 },
  { label: 'Charminar, Hyderabad', lat: 17.3616, lng: 78.4747 },
]

export function LocationSelector() {
  const [open, setOpen] = useState(false)
  const address = useFoodStore((s) => s.address)
  const setAddress = useFoodStore((s) => s.setAddress)
  const userLocation = useFoodStore((s) => s.userLocation)
  const setUserLocation = useFoodStore((s) => s.setUserLocation)
  const locating = useFoodStore((s) => s.locating)
  const setLocating = useFoodStore((s) => s.setLocating)
  const setView = useFoodStore((s) => s.setView)

  const detectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation not supported', { description: 'Your browser does not support location detection.' })
      return
    }
    setLocating(true)
    setOpen(false)
    toast.info('Detecting your location…', { description: 'Please allow location access in your browser.' })

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        const label = nearestAreaLabel({ lat: latitude, lng: longitude })
        const loc: UserLocation = {
          lat: latitude,
          lng: longitude,
          label,
          accuracy,
          source: 'gps',
          detectedAt: Date.now(),
        }
        setUserLocation(loc)
        setAddress(label)
        setLocating(false)
        setView('home')
        toast.success('Location detected with GPS', {
          description: `${label} (${formatCoords(loc)}, ${formatAccuracy(accuracy)})`,
        })
      },
      (err) => {
        setLocating(false)
        let msg = 'Could not detect your location.'
        if (err.code === 1) msg = 'Location permission denied. Please allow location access or pick a city manually.'
        else if (err.code === 2) msg = 'Location unavailable. Try again or pick a city manually.'
        else if (err.code === 3) msg = 'Location request timed out. Try again.'
        toast.error('Location detection failed', { description: msg })
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const pickCity = (label: string, lat: number, lng: number) => {
    const loc: UserLocation = {
      lat,
      lng,
      label,
      source: 'manual',
      detectedAt: Date.now(),
    }
    setUserLocation(loc)
    setAddress(label)
    setOpen(false)
    setView('home')
    toast.success(`Showing restaurants near ${label}`, {
      description: `${formatCoords(loc)} · sorted by distance`,
    })
  }

  const clearLocation = () => {
    setUserLocation(null)
    setAddress('MG Road, Bangalore')
    toast.info('Location cleared — showing all restaurants')
  }

  const hyderabadLocations = LOCATIONS.filter((l) => l.label.includes('Hyderabad'))
  const bangaloreLocations = LOCATIONS.filter((l) => l.label.includes('Bangalore'))

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="group hidden min-w-0 items-center gap-1.5 border-l border-border pl-3 sm:flex" aria-label="Change location">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-semibold text-foreground">
            {userLocation ? userLocation.label : address}
          </span>
          {userLocation && (
            <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold uppercase text-primary">
              <Crosshair className="h-2.5 w-2.5" />
              {userLocation.source === 'gps' ? 'GPS' : 'Set'}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[340px]">
        <SheetHeader className="p-5 pb-2">
          <SheetTitle className="text-lg font-bold">Your location</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Detect your precise location with GPS, or pick a city area to see nearby restaurants.
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-5">
          {/* GPS detect */}
          <button
            onClick={detectLocation}
            disabled={locating}
            className={cn(
              'mb-4 flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-primary bg-primary/5 p-3 text-left transition hover:bg-primary/10',
              locating && 'opacity-70'
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-primary">
                {locating ? 'Detecting…' : 'Use my current location'}
              </div>
              <div className="text-xs text-muted-foreground">
                {locating ? 'Waiting for GPS fix (high accuracy)' : 'GPS precision · recommends nearby restaurants'}
              </div>
            </div>
          </button>

          {/* Current detected location */}
          {userLocation && !locating && (
            <div className="mb-4 rounded-xl border border-green-500/30 bg-green-50 p-3 dark:bg-green-950/20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <div className="text-sm font-bold text-green-800 dark:text-green-400">{userLocation.label}</div>
                    <div className="font-mono text-[11px] text-green-700/80 dark:text-green-500/70">
                      {formatCoords(userLocation)} {formatAccuracy(userLocation.accuracy)}
                    </div>
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-600">
                      Source: {userLocation.source === 'gps' ? 'GPS (high accuracy)' : 'Manually set'}
                    </div>
                  </div>
                </div>
                <button onClick={clearLocation} className="text-muted-foreground hover:text-destructive" aria-label="Clear location">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Hyderabad quick pick */}
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Hyderabad
            </div>
            <div className="space-y-1.5">
              {hyderabadLocations.map((loc) => (
                <button
                  key={loc.label}
                  onClick={() => pickCity(loc.label, loc.lat, loc.lng)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left text-sm transition hover:border-primary hover:bg-accent',
                    userLocation?.label === loc.label && 'border-primary bg-accent'
                  )}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 font-medium">{loc.label.replace(', Hyderabad', '')}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bangalore quick pick */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Bangalore
            </div>
            <div className="space-y-1.5">
              {bangaloreLocations.map((loc) => (
                <button
                  key={loc.label}
                  onClick={() => pickCity(loc.label, loc.lat, loc.lng)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left text-sm transition hover:border-primary hover:bg-accent',
                    userLocation?.label === loc.label && 'border-primary bg-accent'
                  )}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 font-medium">{loc.label.replace(', Bangalore', '')}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Compact mobile location button
export function MobileLocationButton() {
  const address = useFoodStore((s) => s.address)
  const userLocation = useFoodStore((s) => s.userLocation)
  const locating = useFoodStore((s) => s.locating)
  const setLocating = useFoodStore((s) => s.setLocating)
  const setUserLocation = useFoodStore((s) => s.setUserLocation)
  const setAddress = useFoodStore((s) => s.setAddress)
  const setView = useFoodStore((s) => s.setView)

  const detect = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }
    setLocating(true)
    toast.info('Detecting your location…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        const label = nearestAreaLabel({ lat: latitude, lng: longitude })
        setUserLocation({ lat: latitude, lng: longitude, label, accuracy, source: 'gps', detectedAt: Date.now() })
        setAddress(label)
        setLocating(false)
        setView('home')
        toast.success('Location detected', { description: label })
      },
      (err) => {
        setLocating(false)
        toast.error('Location failed', { description: err.message })
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={detect} disabled={locating} className="flex min-w-0 items-center gap-1" aria-label="Detect location">
        {locating ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" /> : <LocateFixed className="h-4 w-4 shrink-0 text-primary" />}
        <span className="truncate text-xs font-semibold">{userLocation ? userLocation.label.split(',')[0] : address.split(',')[0]}</span>
      </button>
    </div>
  )
}
