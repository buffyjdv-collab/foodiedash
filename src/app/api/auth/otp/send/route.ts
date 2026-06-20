import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateOtp, normalizePhone, isValidPhone } from '@/lib/auth'
import { DEMO_OTP, DEMO_PHONES } from '@/lib/demo-users'

const OTP_TTL_MS = 1000 * 60 * 5 // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 })
    }
    const normalized = normalizePhone(phone)
    if (!isValidPhone(normalized)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number. Enter a 10-digit Indian mobile number.' },
        { status: 400 }
      )
    }

    // Rate limit: at most 3 unused OTPs in the last 10 minutes for this phone.
    const recent = await db.otpCode.count({
      where: {
        phone: normalized,
        createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) },
      },
    })
    if (recent >= 3) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please wait a few minutes.' },
        { status: 429 }
      )
    }

    const isDemo = DEMO_PHONES.includes(normalized)
    const code = isDemo ? DEMO_OTP : generateOtp()

    await db.otpCode.create({
      data: {
        phone: normalized,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    })

    // For demo accounts the OTP is fixed and shown on the login screen.
    // For ad-hoc numbers we return the generated OTP so the UI can display it
    // (since there's no real SMS gateway in this sandbox).
    return NextResponse.json({
      success: true,
      message: isDemo
        ? 'Demo account detected. Use OTP 123456 to sign in.'
        : `OTP sent. (Demo sandbox: your code is ${code})`,
      isDemo,
      ...(isDemo ? { demoOtp: DEMO_OTP } : { otp: code }),
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
