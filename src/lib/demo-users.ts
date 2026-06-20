// Demo account catalogue. Kept client-safe (no DB imports) so the login UI
// can render the quick-login role picker. Mirrors prisma/seed-rbac.ts.

export const DEMO_OTP = '123456'

export interface DemoAccount {
  phone: string
  name: string
  role: string
  roleLabel: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { phone: '+919876543201', name: 'Ananya Verma', role: 'SUPER_ADMIN', roleLabel: 'Super Admin' },
  { phone: '+919876543202', name: 'Rahul Mehta', role: 'CITY_ADMIN', roleLabel: 'City Admin' },
  { phone: '+919876543203', name: 'Priya Nair', role: 'FINANCE_MANAGER', roleLabel: 'Finance Manager' },
  { phone: '+919876543204', name: 'Vikram Singh', role: 'OPERATIONS_MANAGER', roleLabel: 'Operations Manager' },
  { phone: '+919876543205', name: 'Deepa Rao', role: 'SUPPORT_AGENT', roleLabel: 'Support Agent' },
  { phone: '+919876543206', name: 'Karan Malhotra', role: 'MARKETING_MANAGER', roleLabel: 'Marketing Manager' },
  { phone: '+919876543207', name: 'Imran Khan', role: 'RESTAURANT_OWNER', roleLabel: 'Restaurant Owner' },
  { phone: '+919876543208', name: 'Sunita Devi', role: 'RESTAURANT_STAFF', roleLabel: 'Restaurant Staff' },
  { phone: '+919876543209', name: 'Ajay Kumar', role: 'DELIVERY_PARTNER', roleLabel: 'Delivery Partner' },
  { phone: '+919876543210', name: 'Aditya Sharma', role: 'CUSTOMER', roleLabel: 'Customer' },
]

export const DEMO_PHONES = DEMO_ACCOUNTS.map((u) => u.phone)
