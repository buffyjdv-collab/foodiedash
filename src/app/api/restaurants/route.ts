import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { haversineKm } from '@/lib/geo'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const cuisine = searchParams.get('cuisine') || ''
    const vegOnly = searchParams.get('veg') === 'true'
    const sort = searchParams.get('sort') || 'relevance' // relevance, rating, deliveryTime, costLow, costHigh, distance
    const fastDelivery = searchParams.get('fast') === 'true'
    const rating4plus = searchParams.get('rating4') === 'true'

    // Geolocation params (precision-based nearby filtering)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radiusKm = parseFloat(searchParams.get('radius') || '15') // default 15km
    const city = searchParams.get('city') || '' // optional city filter (e.g. "Hyderabad")

    const userLoc = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { cuisine: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (cuisine) {
      where.cuisine = { contains: cuisine }
    }
    if (vegOnly) where.isPureVeg = true
    if (city) {
      where.city = { name: { contains: city } }
    }

    let restaurants = await db.restaurant.findMany({
      where,
      orderBy: [{ isPromoted: 'desc' }, { rating: 'desc' }],
    })

    if (fastDelivery) restaurants = restaurants.filter((r) => r.deliveryTime <= 30)
    if (rating4plus) restaurants = restaurants.filter((r) => r.rating >= 4.0)

    // Compute distance + filter by radius when user location is provided
    let withDistance: (typeof restaurants[number] & { distance?: number })[] = restaurants
    if (userLoc) {
      withDistance = restaurants
        .map((r) => {
          // Skip restaurants without coordinates (can't compute distance)
          if (r.latitude === null || r.longitude === null) return { ...r, distance: null as number | null }
          const distance = haversineKm(userLoc, { lat: r.latitude, lng: r.longitude })
          return { ...r, distance }
        })
        .filter((r) => r.distance === null || r.distance <= radiusKm) as (typeof restaurants[number] & { distance?: number })[]
    }

    // Apply sort
    if (sort === 'distance' && userLoc) {
      withDistance.sort((a, b) => {
        const da = a.distance ?? Infinity
        const db = b.distance ?? Infinity
        return da - db
      })
    } else if (sort === 'rating') {
      withDistance.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount)
    } else if (sort === 'deliveryTime') {
      withDistance.sort((a, b) => a.deliveryTime - b.deliveryTime || b.rating - a.rating)
    } else if (sort === 'costLow') {
      withDistance.sort((a, b) => a.costForTwo - b.costForTwo)
    } else if (sort === 'costHigh') {
      withDistance.sort((a, b) => b.costForTwo - a.costForTwo)
    } else {
      // relevance: promoted first, then by rating (preserved from orderBy)
      withDistance.sort((a, b) => Number(b.isPromoted) - Number(a.isPromoted) || b.rating - a.rating)
    }

    return NextResponse.json({ success: true, restaurants: withDistance })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
