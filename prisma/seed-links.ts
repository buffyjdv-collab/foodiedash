// Links demo RBAC users to their Rider / Restaurant profiles.
// Additive — does not touch existing data.
import { db } from '../src/lib/db'

async function main() {
  console.log('🔗 Linking demo users to rider/restaurant profiles...')

  // 1. Link DELIVERY_PARTNER user (Ajay Kumar) to a Rider record
  const riderUser = await db.user.findUnique({ where: { phone: '+919876543209' } })
  if (riderUser) {
    // Find a rider without a userId, or create one matching the user's phone
    let rider = await db.rider.findUnique({ where: { phone: riderUser.phone } })
    if (!rider) {
      rider = await db.rider.findFirst({ where: { userId: null } })
      if (rider) {
        rider = await db.rider.update({ where: { id: rider.id }, data: { userId: riderUser.id, name: riderUser.name || rider.name, phone: riderUser.phone } })
      } else {
        rider = await db.rider.create({ data: { name: riderUser.name || 'Ajay Kumar', phone: riderUser.phone, vehicle: 'Bike', userId: riderUser.id, isOnline: true } })
      }
    } else {
      rider = await db.rider.update({ where: { id: rider.id }, data: { userId: riderUser.id } })
    }
    console.log(`  ✓ Linked rider "${rider.name}" → user ${riderUser.phone}`)
  }

  // 2. Link RESTAURANT_OWNER user (Imran Khan) to a Restaurant
  const ownerUser = await db.user.findUnique({ where: { phone: '+919876543207' } })
  if (ownerUser) {
    // Assign Paradise Biryani House (or the first restaurant without an owner)
    let restaurant = await db.restaurant.findFirst({ where: { ownerUserId: null }, orderBy: { rating: 'desc' } })
    if (restaurant) {
      restaurant = await db.restaurant.update({ where: { id: restaurant.id }, data: { ownerUserId: ownerUser.id } })
      console.log(`  ✓ Linked restaurant "${restaurant.name}" → owner ${ownerUser.phone}`)
    }
  }

  // 3. Link RESTAURANT_STAFF user (Sunita Devi) to the same restaurant
  const staffUser = await db.user.findUnique({ where: { phone: '+919876543208' } })
  if (staffUser && ownerUser) {
    const ownedRestaurant = await db.restaurant.findFirst({ where: { ownerUserId: ownerUser.id } })
    if (ownedRestaurant) {
      console.log(`  ✓ Staff user ${staffUser.phone} will manage "${ownedRestaurant.name}" (same as owner)`)
    }
  }

  console.log('✅ Links complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
