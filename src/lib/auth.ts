import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { ALL_PERMISSIONS } from '@/lib/rbac'

export const SESSION_COOKIE = 'fd_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export interface AuthUser {
  id: string
  phone: string
  name: string | null
  email: string | null
  roles: string[]
  permissions: string[]
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Read the session cookie (if any) and return the authenticated user with
 * their roles + flattened permissions. Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        },
      },
    },
  })

  if (!session) return null
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  if (!session.user.isActive) return null

  // Bump lastUsedAt (fire-and-forget)
  db.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }).catch(() => {})

  const roles = session.user.userRoles.map((ur) => ur.role.name)
  // Flatten + dedupe permissions across all roles
  const permSet = new Set<string>()
  for (const ur of session.user.userRoles) {
    for (const rp of ur.role.permissions) {
      permSet.add(rp.permission.action)
    }
  }

  return {
    id: session.user.id,
    phone: session.user.phone,
    name: session.user.name,
    email: session.user.email,
    roles,
    permissions: Array.from(permSet),
  }
}

/** Returns ALL permissions if the user is a SUPER_ADMIN, else their granted set. */
export function effectivePermissions(user: AuthUser): string[] {
  if (user.roles.includes('SUPER_ADMIN')) return [...ALL_PERMISSIONS]
  return user.permissions
}

/** Synchronous permission check against an AuthUser. */
export function can(user: AuthUser | null, action: string): boolean {
  if (!user) return false
  if (user.roles.includes('SUPER_ADMIN')) return true
  return user.permissions.includes(action)
}

/** Require authentication; throws a 401-shaped error if missing. */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    const err = new Error('Authentication required') as any
    err.statusCode = 401
    throw err
  }
  return user
}

/** Require a specific particle-level permission; throws 403 if missing. */
export async function requirePermission(action: string): Promise<AuthUser> {
  const user = await requireAuth()
  if (!can(user, action)) {
    const err = new Error(`Forbidden: requires permission "${action}"`) as any
    err.statusCode = 403
    err.permission = action
    throw err
  }
  return user
}

/** Create a session for a user and set the cookie. Returns the token. */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.session.create({ data: { token, userId, expiresAt } })

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
  return token
}

/** Destroy the current session + clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {})
  }
  store.delete(SESSION_COOKIE)
}

/** Generate a 6-digit OTP code. */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Normalise an Indian phone number to +91XXXXXXXXXX. */
export function normalizePhone(input: string): string {
  let p = input.replace(/[^\d+]/g, '')
  if (p.startsWith('+91')) p = p.slice(3)
  else if (p.startsWith('91') && p.length === 12) p = p.slice(2)
  else if (p.startsWith('0')) p = p.slice(1)
  if (p.length !== 10) return input.trim()
  return '+91' + p
}

export function isValidPhone(phone: string): boolean {
  return /^\+91\d{10}$/.test(phone)
}
