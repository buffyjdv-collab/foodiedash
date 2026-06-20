import { NextResponse } from 'next/server'
import { getAuthUser, effectivePermissions } from '@/lib/auth'
import { ROLES } from '@/lib/rbac'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: true, user: null })
  const roleLabels = user.roles.map(
    (name) => ROLES.find((r) => r.name === name)?.label || name
  )
  return NextResponse.json({
    success: true,
    user: { ...user, roleLabels, permissions: effectivePermissions(user) },
  })
}
