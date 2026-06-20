// Geolocation helpers: Haversine distance, formatting, coordinate parsing.

export interface LatLng {
  lat: number
  lng: number
}

export interface UserLocation extends LatLng {
  label: string
  accuracy?: number // meters, from geolocation API
  source: 'gps' | 'manual' | 'simulated'
  detectedAt: number // epoch ms
}

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Haversine great-circle distance between two lat/lng points, in kilometres.
 * Precision is sufficient for restaurant proximity (sub-100m at city scale).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/** Format a distance for display: "< 100 m" or "1.2 km". */
export function formatDistance(km: number): string {
  if (km < 0.1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/** Format a coordinate pair for display. */
export function formatCoords(loc: LatLng): string {
  return `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
}

/** Format accuracy (in metres) from the geolocation API. */
export function formatAccuracy(meters?: number): string {
  if (!meters && meters !== 0) return ''
  if (meters < 1000) return `±${Math.round(meters)} m`
  return `±${(meters / 1000).toFixed(1)} km`
}

/** A rough area label for a Hyderabad coordinate, based on known neighbourhoods. */
const HY_AREAS: { name: string; lat: number; lng: number }[] = [
  { name: 'Banjara Hills', lat: 17.4126, lng: 78.4396 },
  { name: 'Jubilee Hills', lat: 17.4239, lng: 78.4083 },
  { name: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
  { name: 'Hitech City', lat: 17.4435, lng: 78.3772 },
  { name: 'Madhapur', lat: 17.4483, lng: 78.3915 },
  { name: 'Kondapur', lat: 17.4615, lng: 78.3661 },
  { name: 'Begumpet', lat: 17.4434, lng: 78.4602 },
  { name: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
  { name: 'Abids', lat: 17.3888, lng: 78.4812 },
  { name: 'Charminar (Old City)', lat: 17.3616, lng: 78.4747 },
  { name: 'Kukatpally', lat: 17.4849, lng: 78.4138 },
  { name: 'Ameerpet', lat: 17.4374, lng: 78.4487 },
]

const BLR_AREAS: { name: string; lat: number; lng: number }[] = [
  { name: 'MG Road', lat: 12.9756, lng: 77.6044 },
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6474 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'Jayanagar', lat: 12.9250, lng: 77.5938 },
]

/** Returns "Near <Area>, <City>" for a coordinate by nearest known neighbourhood. */
export function nearestAreaLabel(loc: LatLng): string {
  // Detect city by proximity to centre.
  const hyCenter = { lat: 17.385, lng: 78.4867 }
  const blrCenter = { lat: 12.9716, lng: 77.5946 }
  const distHy = haversineKm(loc, hyCenter)
  const distBlr = haversineKm(loc, blrCenter)

  if (distHy < 30) {
    const nearest = HY_AREAS.reduce((best, a) => {
      const d = haversineKm(loc, a)
      return d < best.d ? { a, d } : best
    }, { a: HY_AREAS[0], d: Infinity })
    return `Near ${nearest.a.name}, Hyderabad`
  }
  if (distBlr < 30) {
    const nearest = BLR_AREAS.reduce((best, a) => {
      const d = haversineKm(loc, a)
      return d < best.d ? { a, d } : best
    }, { a: BLR_AREAS[0], d: Infinity })
    return `Near ${nearest.a.name}, Bangalore`
  }
  return formatCoords(loc)
}

/** Is this coordinate within the Hyderabad metro area (~30km of centre)? */
export function isInHyderabad(loc: LatLng): boolean {
  return haversineKm(loc, { lat: 17.385, lng: 78.4867 }) < 30
}

/** Is this coordinate within the Bangalore metro area? */
export function isInBangalore(loc: LatLng): boolean {
  return haversineKm(loc, { lat: 12.9716, lng: 77.5946 }) < 30
}
