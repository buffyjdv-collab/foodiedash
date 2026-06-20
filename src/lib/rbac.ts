// Particle-level RBAC definitions.
// A "permission" is a fine-grained `<module>.<action>` string such as
// "restaurants.update" or "orders.cancel". Roles are bundles of permissions.

export interface PermissionDef {
  action: string
  module: string
  label: string
  description: string
}

export interface RoleDef {
  name: string
  label: string
  description: string
  permissions: string[] // list of permission actions
}

// ---------------------------------------------------------
// Permission catalogue (particle level)
// ---------------------------------------------------------
export const PERMISSIONS: PermissionDef[] = [
  // Users & access
  { action: 'users.create', module: 'users', label: 'Create Users', description: 'Create new user accounts' },
  { action: 'users.read', module: 'users', label: 'View Users', description: 'View user accounts' },
  { action: 'users.update', module: 'users', label: 'Edit Users', description: 'Update user accounts & roles' },
  { action: 'users.delete', module: 'users', label: 'Delete Users', description: 'Delete user accounts' },
  // Roles & permissions
  { action: 'roles.read', module: 'roles', label: 'View Roles', description: 'View roles & permissions' },
  { action: 'roles.update', module: 'roles', label: 'Manage Roles', description: 'Edit role-permission assignments' },
  // Cities & zones
  { action: 'cities.create', module: 'cities', label: 'Add Cities', description: 'Create new cities' },
  { action: 'cities.read', module: 'cities', label: 'View Cities', description: 'View cities' },
  { action: 'cities.update', module: 'cities', label: 'Edit Cities', description: 'Update cities' },
  { action: 'cities.delete', module: 'cities', label: 'Delete Cities', description: 'Delete cities' },
  // Restaurants
  { action: 'restaurants.create', module: 'restaurants', label: 'Add Restaurants', description: 'Onboard new restaurants' },
  { action: 'restaurants.read', module: 'restaurants', label: 'View Restaurants', description: 'View restaurants' },
  { action: 'restaurants.update', module: 'restaurants', label: 'Edit Restaurants', description: 'Update restaurant profiles' },
  { action: 'restaurants.delete', module: 'restaurants', label: 'Delete Restaurants', description: 'Delete restaurants' },
  // Menus
  { action: 'menus.create', module: 'menus', label: 'Add Menu Items', description: 'Create menu categories & items' },
  { action: 'menus.read', module: 'menus', label: 'View Menus', description: 'View menu items' },
  { action: 'menus.update', module: 'menus', label: 'Edit Menus', description: 'Update menu items & availability' },
  { action: 'menus.delete', module: 'menus', label: 'Delete Menus', description: 'Delete menu items' },
  // Orders
  { action: 'orders.create', module: 'orders', label: 'Place Orders', description: 'Place a new order' },
  { action: 'orders.read', module: 'orders', label: 'View Orders', description: 'View orders' },
  { action: 'orders.update', module: 'orders', label: 'Update Orders', description: 'Accept/prepare/dispatch orders' },
  { action: 'orders.cancel', module: 'orders', label: 'Cancel Orders', description: 'Cancel orders' },
  // Riders
  { action: 'riders.create', module: 'riders', label: 'Add Riders', description: 'Onboard delivery partners' },
  { action: 'riders.read', module: 'riders', label: 'View Riders', description: 'View delivery partners' },
  { action: 'riders.update', module: 'riders', label: 'Edit Riders', description: 'Update rider details' },
  { action: 'riders.delete', module: 'riders', label: 'Delete Riders', description: 'Remove delivery partners' },
  // Payments
  { action: 'payments.read', module: 'payments', label: 'View Payments', description: 'View payment transactions' },
  { action: 'payments.process', module: 'payments', label: 'Process Payments', description: 'Process payments & settlements' },
  { action: 'payments.refund', module: 'payments', label: 'Issue Refunds', description: 'Issue refunds to customers' },
  // Settlements & commissions
  { action: 'settlements.read', module: 'settlements', label: 'View Settlements', description: 'View restaurant/rider settlements' },
  { action: 'settlements.process', module: 'settlements', label: 'Process Settlements', description: 'Run settlement payouts' },
  { action: 'commissions.read', module: 'commissions', label: 'View Commissions', description: 'View commission rates' },
  { action: 'commissions.update', module: 'commissions', label: 'Edit Commissions', description: 'Update commission rates' },
  // Coupons & marketing
  { action: 'coupons.create', module: 'coupons', label: 'Create Coupons', description: 'Create promo coupons' },
  { action: 'coupons.read', module: 'coupons', label: 'View Coupons', description: 'View coupons' },
  { action: 'coupons.update', module: 'coupons', label: 'Edit Coupons', description: 'Update coupons' },
  { action: 'coupons.delete', module: 'coupons', label: 'Delete Coupons', description: 'Delete coupons' },
  { action: 'campaigns.create', module: 'campaigns', label: 'Create Campaigns', description: 'Create marketing campaigns' },
  { action: 'campaigns.read', module: 'campaigns', label: 'View Campaigns', description: 'View campaigns' },
  { action: 'campaigns.update', module: 'campaigns', label: 'Edit Campaigns', description: 'Update campaigns' },
  { action: 'campaigns.delete', module: 'campaigns', label: 'Delete Campaigns', description: 'Delete campaigns' },
  { action: 'notifications.send', module: 'notifications', label: 'Send Notifications', description: 'Send push/SMS/email notifications' },
  // Support
  { action: 'tickets.create', module: 'tickets', label: 'Create Tickets', description: 'Create support tickets' },
  { action: 'tickets.read', module: 'tickets', label: 'View Tickets', description: 'View support tickets' },
  { action: 'tickets.update', module: 'tickets', label: 'Update Tickets', description: 'Respond to tickets' },
  { action: 'tickets.resolve', module: 'tickets', label: 'Resolve Tickets', description: 'Resolve/close tickets' },
  // Reviews
  { action: 'reviews.create', module: 'reviews', label: 'Write Reviews', description: 'Write restaurant reviews' },
  { action: 'reviews.read', module: 'reviews', label: 'View Reviews', description: 'View reviews' },
  { action: 'reviews.moderate', module: 'reviews', label: 'Moderate Reviews', description: 'Approve/remove reviews' },
  // Wallets
  { action: 'wallets.read', module: 'wallets', label: 'View Wallets', description: 'View wallet balances' },
  { action: 'wallets.credit', module: 'wallets', label: 'Credit Wallet', description: 'Add money to wallets' },
  { action: 'wallets.debit', module: 'wallets', label: 'Debit Wallet', description: 'Deduct money from wallets' },
  // Reports & analytics
  { action: 'reports.read', module: 'reports', label: 'View Reports', description: 'View business reports' },
  { action: 'analytics.read', module: 'analytics', label: 'View Analytics', description: 'View analytics dashboards' },
  // Settings
  { action: 'settings.read', module: 'settings', label: 'View Settings', description: 'View system settings' },
  { action: 'settings.update', module: 'settings', label: 'Edit Settings', description: 'Update system settings' },
]

// All permission action strings
export const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.action)

// Helper: get all actions for a module
export function permissionsForModule(module: string): string[] {
  return PERMISSIONS.filter((p) => p.module === module).map((p) => p.action)
}

// ---------------------------------------------------------
// Roles (matching the Swiggy-clone org structure)
// ---------------------------------------------------------
export const ROLES: RoleDef[] = [
  {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Unrestricted access to every module and action across the platform',
    permissions: [...ALL_PERMISSIONS],
  },
  {
    name: 'CITY_ADMIN',
    label: 'City Admin',
    description: 'Manages city-level operations: restaurants, riders, orders, reports',
    permissions: [
      'restaurants.create', 'restaurants.read', 'restaurants.update', 'restaurants.delete',
      'menus.create', 'menus.read', 'menus.update', 'menus.delete',
      'riders.create', 'riders.read', 'riders.update',
      'orders.read', 'orders.update', 'orders.cancel',
      'cities.read', 'cities.update',
      'users.read',
      'reports.read', 'analytics.read',
      'coupons.read', 'campaigns.read',
    ],
  },
  {
    name: 'FINANCE_MANAGER',
    label: 'Finance Manager',
    description: 'Handles payments, settlements, refunds, commissions & revenue',
    permissions: [
      'payments.read', 'payments.process', 'payments.refund',
      'settlements.read', 'settlements.process',
      'commissions.read', 'commissions.update',
      'orders.read',
      'reports.read', 'analytics.read',
      'riders.read', 'restaurants.read',
    ],
  },
  {
    name: 'OPERATIONS_MANAGER',
    label: 'Operations Manager',
    description: 'Monitors live orders, riders and restaurant operations',
    permissions: [
      'orders.read', 'orders.update', 'orders.cancel',
      'riders.read', 'riders.update',
      'restaurants.read', 'menus.read',
      'reports.read', 'analytics.read',
      'tickets.read', 'tickets.update',
    ],
  },
  {
    name: 'SUPPORT_AGENT',
    label: 'Support Agent',
    description: 'Handles customer tickets, refund requests and complaints',
    permissions: [
      'tickets.create', 'tickets.read', 'tickets.update', 'tickets.resolve',
      'orders.read', 'orders.cancel',
      'payments.refund',
      'reviews.read',
      'users.read',
    ],
  },
  {
    name: 'MARKETING_MANAGER',
    label: 'Marketing Manager',
    description: 'Manages coupons, campaigns, push notifications & loyalty',
    permissions: [
      'coupons.create', 'coupons.read', 'coupons.update', 'coupons.delete',
      'campaigns.create', 'campaigns.read', 'campaigns.update', 'campaigns.delete',
      'notifications.send',
      'reviews.read', 'reviews.moderate',
      'analytics.read', 'reports.read',
    ],
  },
  {
    name: 'RESTAURANT_OWNER',
    label: 'Restaurant Owner',
    description: 'Manages their restaurant profile, menu, orders, offers & reports',
    permissions: [
      'restaurants.read', 'restaurants.update',
      'menus.create', 'menus.read', 'menus.update', 'menus.delete',
      'orders.read', 'orders.update',
      'coupons.read', 'coupons.create',
      'reports.read',
      'reviews.read',
      'payments.read',
    ],
  },
  {
    name: 'RESTAURANT_STAFF',
    label: 'Restaurant Staff',
    description: 'Accepts, prepares and dispatches orders from the kitchen',
    permissions: [
      'orders.read', 'orders.update',
      'menus.read',
    ],
  },
  {
    name: 'DELIVERY_PARTNER',
    label: 'Delivery Partner',
    description: 'Accepts deliveries, tracks live orders & views earnings',
    permissions: [
      'orders.read', 'orders.update',
      'riders.read',
      'wallets.read',
    ],
  },
  {
    name: 'CUSTOMER',
    label: 'Customer',
    description: 'Orders food, makes payments, writes reviews & uses wallet',
    permissions: [
      'orders.create', 'orders.read', 'orders.cancel',
      'restaurants.read', 'menus.read',
      'reviews.create', 'reviews.read',
      'coupons.read',
      'wallets.read',
      'tickets.create', 'tickets.read',
    ],
  },
]

export const ROLE_NAMES = ROLES.map((r) => r.name)

// ---------------------------------------------------------
// Permission check helper
// ---------------------------------------------------------
export function hasPermission(permissions: string[] | undefined | null, action: string): boolean {
  if (!permissions) return false
  return permissions.includes(action)
}

export function hasAnyPermission(permissions: string[] | undefined | null, actions: string[]): boolean {
  if (!permissions) return false
  return actions.some((a) => permissions.includes(a))
}

export function hasAllPermissions(permissions: string[] | undefined | null, actions: string[]): boolean {
  if (!permissions) return false
  return actions.every((a) => permissions.includes(a))
}

// Modules shown in the admin portal (ordered)
export const ADMIN_MODULES = [
  { id: 'overview', name: 'Overview', icon: 'LayoutDashboard', permission: null },
  { id: 'users', name: 'Users', icon: 'Users', permission: 'users.read' },
  { id: 'roles', name: 'Roles & Permissions', icon: 'ShieldCheck', permission: 'roles.read' },
  { id: 'restaurants', name: 'Restaurants', icon: 'Store', permission: 'restaurants.read' },
  { id: 'orders', name: 'Orders', icon: 'Receipt', permission: 'orders.read' },
  { id: 'riders', name: 'Riders', icon: 'Bike', permission: 'riders.read' },
  { id: 'payments', name: 'Payments', icon: 'CreditCard', permission: 'payments.read' },
  { id: 'settlements', name: 'Settlements', icon: 'Landmark', permission: 'settlements.read' },
  { id: 'coupons', name: 'Coupons', icon: 'Ticket', permission: 'coupons.read' },
  { id: 'campaigns', name: 'Campaigns', icon: 'Megaphone', permission: 'campaigns.read' },
  { id: 'reviews', name: 'Reviews', icon: 'Star', permission: 'reviews.read' },
  { id: 'tickets', name: 'Support Tickets', icon: 'LifeBuoy', permission: 'tickets.read' },
  { id: 'analytics', name: 'Analytics', icon: 'BarChart3', permission: 'analytics.read' },
  { id: 'settings', name: 'Settings', icon: 'Settings', permission: 'settings.read' },
]
