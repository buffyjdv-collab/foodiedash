import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, normalizePhone, isValidPhone } from '@/lib/auth'
import { DEMO_OTP, DEMO_PHONES } from '@/lib/demo-users'
import { ROLES } from '@/lib/rbac'

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'Phone and OTP code are required' }, { status: 400 })
    }
    const normalized = normalizePhone(phone)
    if (!isValidPhone(normalized)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 })
    }

    // 1. Demo account shortcut: accept the fixed demo OTP for seeded phones.
    const isDemoPhone = DEMO_PHONES.includes(normalized)
    if (isDemoPhone && code === DEMO_OTP) {
      const user = await db.user.findUnique({
        where: { phone: normalized },
        include: {
          userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        },
      })
      if (!user || !user.isActive) {
        return NextResponse.json({ success: false, error: 'Account not found or disabled' }, { status: 404 })
      }
      await createSession(user.id)
      return NextResponse.json({ success: true, user: serializeUser(user) })
    }

    // 2. Normal OTP flow: look up the latest unused, non-expired code for this phone.
    const otp = await db.otpCode.findFirst({
      where: { phone: normalized, used: false },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json({ success: false, error: 'No OTP found. Please request a new one.' }, { status: 400 })
    }
    if (otp.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'OTP expired. Please request a new one.' }, { status: 400 })
    }
    if (otp.attempts >= 5) {
      await db.otpCode.update({ where: { id: otp.id }, data: { used: true } })
      return NextResponse.json({ success: false, error: 'Too many attempts. Request a new OTP.' }, { status: 429 })
    }

    if (otp.code !== code) {
      await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
      return NextResponse.json({ success: false, error: 'Incorrect OTP. Please try again.' }, { status: 400 })
    }

    // Mark OTP as used
    await db.otpCode.update({ where: { id: otp.id }, data: { used: true } })

    // Find-or-create user. New sign-ups default to the CUSTOMER role.
    let user = await db.user.findUnique({
      where: { phone: normalized },
      include: {
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    })

    if (!user) {
      user = await db.user.create({
        data: {
          phone: normalized,
          name: 'New Customer',
          userRoles: {
            create: [
              {
                role: {
                  connect: { name: 'CUSTOMER' },
                },
              },
            ],
          },
        },
        include: {
          userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        },
      })
    } else if (!user.isActive) {
      return NextResponse.json({ success: false, error: 'Account is disabled' }, { status: 403 })
    }

    await createSession(user.id)
    return NextResponse.json({ success: true, user: serializeUser(user) })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

function serializeUser(user: any) {
  const roles = user.userRoles.map((ur: any) => ur.role.name)
  const roleLabels = user.userRoles.map((ur: any) => {
    const def = ROLES.find((r) => r.name === ur.role.name)
    return def?.label || ur.role.name
  })
  const permSet = new Set<string>()
  for (const ur of user.userRoles) {
    for (const rp of ur.role.permissions) {
      permSet.add(rp.permission.action)
    }
  }
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    roles,
    roleLabels,
    permissions: Array.from(permSet),
  }
}
