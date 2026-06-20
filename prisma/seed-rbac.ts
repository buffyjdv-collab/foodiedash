import { db } from '../src/lib/db'
import { ROLES, PERMISSIONS } from '../src/lib/rbac'

// Demo accounts — one per role. OTP for all demo accounts is "123456".
// (The verify endpoint also accepts generated OTPs returned by /otp/send for
// ad-hoc phone numbers not in this list.)
const DEMO_USERS: { phone: string; name: string; email: string; role: string }[] = [
  { phone: '+919876543201', name: 'Ananya Verma', email: 'ananya.admin@foodiedash.io', role: 'SUPER_ADMIN' },
  { phone: '+919876543202', name: 'Rahul Mehta', email: 'rahul.city@foodiedash.io', role: 'CITY_ADMIN' },
  { phone: '+919876543203', name: 'Priya Nair', email: 'priya.finance@foodiedash.io', role: 'FINANCE_MANAGER' },
  { phone: '+919876543204', name: 'Vikram Singh', email: 'vikram.ops@foodiedash.io', role: 'OPERATIONS_MANAGER' },
  { phone: '+919876543205', name: 'Deepa Rao', email: 'deepa.support@foodiedash.io', role: 'SUPPORT_AGENT' },
  { phone: '+919876543206', name: 'Karan Malhotra', email: 'karan.market@foodiedash.io', role: 'MARKETING_MANAGER' },
  { phone: '+919876543207', name: 'Imran Khan', email: 'imran.owner@foodiedash.io', role: 'RESTAURANT_OWNER' },
  { phone: '+919876543208', name: 'Sunita Devi', email: 'sunita.staff@foodiedash.io', role: 'RESTAURANT_STAFF' },
  { phone: '+919876543209', name: 'Ajay Kumar', email: 'ajay.rider@foodiedash.io', role: 'DELIVERY_PARTNER' },
  { phone: '+919876543210', name: 'Aditya Sharma', email: 'aditya@foodiedash.io', role: 'CUSTOMER' },
]

export const DEMO_OTP = '123456'

export const DEMO_PHONES = DEMO_USERS.map((u) => u.phone)

async function main() {
  console.log('🌱 Seeding RBAC (roles, permissions, demo users)...')

  // Clean auth tables (keep existing restaurants/orders intact)
  await db.session.deleteMany()
  await db.otpCode.deleteMany()
  await db.userRole.deleteMany()
  await db.rolePermission.deleteMany()
  await db.permission.deleteMany()
  await db.role.deleteMany()
  // Users linked to orders? we made userId optional, so safe to delete.
  await db.user.deleteMany()

  // 1. Permissions
  const permMap = new Map<string, string>()
  for (const p of PERMISSIONS) {
    const created = await db.permission.create({
      data: { action: p.action, module: p.module, label: p.label, description: p.description },
    })
    permMap.set(p.action, created.id)
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions`)

  // 2. Roles + role-permission links
  const roleMap = new Map<string, string>()
  for (const r of ROLES) {
    const role = await db.role.create({
      data: { name: r.name, label: r.label, description: r.description, isSystem: true },
    })
    roleMap.set(r.name, role.id)
    if (r.permissions.length > 0) {
      await db.rolePermission.createMany({
        data: r.permissions.map((action) => ({
          roleId: role.id,
          permissionId: permMap.get(action)!,
        })),
      })
    }
  }
  console.log(`  ✓ ${ROLES.length} roles`)

  // 3. Demo users (one per role)
  for (const du of DEMO_USERS) {
    const user = await db.user.create({
      data: {
        phone: du.phone,
        name: du.name,
        email: du.email,
        isActive: true,
      },
    })
    await db.userRole.create({
      data: { userId: user.id, roleId: roleMap.get(du.role)! },
    })
  }
  console.log(`  ✓ ${DEMO_USERS.length} demo users (OTP for all: ${DEMO_OTP})`)

  console.log('✅ RBAC seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
