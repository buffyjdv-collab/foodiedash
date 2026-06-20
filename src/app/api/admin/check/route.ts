import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, can } from '@/lib/auth'

// POST /api/admin/check — body { actions: string[] }
// Returns { results: { [action]: boolean } } for the current user.
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, authenticated: false, results: {} }, { status: 401 })
  }
  const { actions } = await req.json()
  const list: string[] = Array.isArray(actions) ? actions : []
  const results: Record<string, boolean> = {}
  for (const a of list) {
    results[a] = can(user, a)
  }
  return NextResponse.json({ success: true, authenticated: true, results })
}
