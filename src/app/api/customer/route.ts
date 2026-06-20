import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Single demo customer
    let customer = await db.customer.findFirst()
    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: 'Aditya Sharma',
          email: 'aditya@example.com',
          phone: '+919812345678',
          walletBalance: 250,
          loyaltyPoints: 480,
        },
      })
    }
    const addresses = await db.address.findMany({ where: { customerId: customer.id } })
    return NextResponse.json({ success: true, customer: { ...customer, addresses } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
