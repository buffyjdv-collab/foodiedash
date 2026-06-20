// Demo account catalogue. Kept client-safe (no DB imports) so the login UI
// can render the quick-login role picker. Mirrors prisma/seed-rbac.ts.

export const DEMO_OTP = '123456'

export interface DemoAccount {
  phone: string
  name: string
  role: string
  roleLabel: string
  category: 'admin' | 'restaurant' | 'delivery' | 'customer'
  icon: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  // Admin & Staff
  { phone: '+919876543201', name: 'Ananya Verma', role: 'SUPER_ADMIN', roleLabel: 'Super Admin', category: 'admin', icon: 'ShieldCheck' },
  { phone: '+919876543202', name: 'Rahul Mehta', role: 'CITY_ADMIN', roleLabel: 'City Admin', category: 'admin', icon: 'Building2' },
  { phone: '+919876543203', name: 'Priya Nair', role: 'FINANCE_MANAGER', roleLabel: 'Finance Manager', category: 'admin', icon: 'Landmark' },
  { phone: '+919876543204', name: 'Vikram Singh', role: 'OPERATIONS_MANAGER', roleLabel: 'Operations Manager', category: 'admin', icon: 'Activity' },
  { phone: '+919876543205', name: 'Deepa Rao', role: 'SUPPORT_AGENT', roleLabel: 'Support Agent', category: 'admin', icon: 'LifeBuoy' },
  { phone: '+919876543206', name: 'Karan Malhotra', role: 'MARKETING_MANAGER', roleLabel: 'Marketing Manager', category: 'admin', icon: 'Megaphone' },
  // Restaurant partners
  { phone: '+919876543207', name: 'Imran Khan', role: 'RESTAURANT_OWNER', roleLabel: 'Restaurant Owner', category: 'restaurant', icon: 'Store' },
  { phone: '+919876543208', name: 'Sunita Devi', role: 'RESTAURANT_STAFF', roleLabel: 'Restaurant Staff', category: 'restaurant', icon: 'ChefHat' },
  // Delivery partners
  { phone: '+919876543209', name: 'Ajay Kumar', role: 'DELIVERY_PARTNER', roleLabel: 'Delivery Partner', category: 'delivery', icon: 'Bike' },
  // Customer
  { phone: '+919876543210', name: 'Aditya Sharma', role: 'CUSTOMER', roleLabel: 'Customer', category: 'customer', icon: 'User' },
]

export const DEMO_PHONES = DEMO_ACCOUNTS.map((u) => u.phone)

export const ROLE_CATEGORIES = [
  { id: 'admin', label: 'Admin & Staff', description: 'Platform operators and managers', icon: 'ShieldCheck' },
  { id: 'restaurant', label: 'Restaurant Partners', description: 'Owners and kitchen staff', icon: 'Store' },
  { id: 'delivery', label: 'Delivery Partners', description: 'Riders and delivery executives', icon: 'Bike' },
  { id: 'customer', label: 'Customer', description: 'Order food, track deliveries', icon: 'User' },
] as const

export function accountsByCategory(cat: string): DemoAccount[] {
  return DEMO_ACCOUNTS.filter((a) => a.category === cat)
}
