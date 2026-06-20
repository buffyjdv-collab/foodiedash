import { NextResponse } from 'next/server'

// Food categories for the discovery carousel
const CATEGORIES = [
  { id: 'biryani', name: 'Biryani', emoji: '🍚', color: '#F59E0B' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', color: '#EF4444' },
  { id: 'burger', name: 'Burgers', emoji: '🍔', color: '#F97316' },
  { id: 'north indian', name: 'North Indian', emoji: '🍛', color: '#DC2626' },
  { id: 'south indian', name: 'South Indian', emoji: '🥞', color: '#10B981' },
  { id: 'chinese', name: 'Chinese', emoji: '🥡', color: '#EAB308' },
  { id: 'italian', name: 'Italian', emoji: '🍝', color: '#8B5CF6' },
  { id: 'desserts', name: 'Desserts', emoji: '🍰', color: '#EC4899' },
  { id: 'healthy', name: 'Healthy', emoji: '🥗', color: '#22C55E' },
  { id: 'rolls', name: 'Rolls', emoji: '🌯', color: '#F59E0B' },
  { id: 'sushi', name: 'Japanese', emoji: '🍣', color: '#06B6D4' },
  { id: 'mexican', name: 'Mexican', emoji: '🌮', color: '#F97316' },
]

export async function GET() {
  return NextResponse.json({ success: true, categories: CATEGORIES })
}
