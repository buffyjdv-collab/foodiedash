'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  AreaChart,
  Area,
} from 'recharts'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Store,
  Receipt,
  Bike,
  CreditCard,
  Landmark,
  Ticket,
  Megaphone,
  Star,
  LifeBuoy,
  BarChart3,
  Settings,
  Lock,
  ArrowLeft,
  LogIn,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldAlert,
  Power,
  Loader2,
  type LucideIcon,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { useAuthStore, type AuthUser } from '@/lib/auth-store'
import { useFoodStore } from '@/lib/store'
import {
  ADMIN_MODULES,
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLES,
  permissionsForModule,
} from '@/lib/rbac'
import { formatINR, formatCount, timeAgo } from '@/lib/format'
import type { Restaurant, Order, Coupon } from '@/lib/types'
import { cn } from '@/lib/utils'

// ============================================================
// Icon map for sidebar modules
// ============================================================
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Store,
  Receipt,
  Bike,
  CreditCard,
  Landmark,
  Ticket,
  Megaphone,
  Star,
  LifeBuoy,
  BarChart3,
  Settings,
}

// ============================================================
// API response shapes
// ============================================================
interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRestaurants: number
  totalOrders: number
  totalRiders: number
  totalCoupons: number
  deliveredOrders: number
  cancelledOrders: number
  revenue: number
  ordersByStatus: Record<string, number>
  usersByRole: Record<string, number>
}

interface UserListItem {
  id: string
  phone: string
  name: string | null
  email: string | null
  isActive: boolean
  createdAt: string
  roles: { name: string; label: string }[]
}

interface RoleListItem {
  id: string
  name: string
  label: string
  description: string
  isSystem: boolean
  userCount: number
  permissions: { action: string; module: string; label: string }[]
}

interface PermissionListItem {
  id: string
  action: string
  module: string
  label: string
  description: string
  roles: string[]
}

// ============================================================
// Helpers
// ============================================================
function canDo(user: AuthUser, action: string): boolean {
  if (user.roles.includes('SUPER_ADMIN')) return true
  return user.permissions.includes(action)
}

function initials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (
    parts
      .map((p) => p[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

function orderStatusColor(status: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'DELIVERED') return 'bg-green-100 text-green-700 border-green-200'
  if (s === 'CANCELLED') return 'bg-red-100 text-red-700 border-red-200'
  if (s === 'PLACED') return 'bg-slate-100 text-slate-700 border-slate-200'
  if (s === 'READY') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-orange-100 text-orange-700 border-orange-200'
}

// Group a list of {module, ...} items by their `module` field.
function groupByModule<T extends { module: string }>(items: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const it of items) {
    if (!out[it.module]) out[it.module] = []
    out[it.module].push(it)
  }
  return out
}

// ============================================================
// Public component
// ============================================================
export function AdminPortal() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const setView = useFoodStore((s) => s.setView)

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Skeleton className="h-12 rounded-xl mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl mt-4" />
      </div>
    )
  }

  if (!user) {
    return (
      <AccessDeniedCard
        title="Access denied"
        description="Please sign in to access the admin portal."
        action={
          <Button onClick={() => setLoginOpen(true)}>
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
        }
      />
    )
  }

  if (!isAdmin()) {
    return (
      <AccessDeniedCard
        title="Limited access"
        description={`Your role (${user.roleLabels.join(', ') || 'Customer'}) doesn't include portal access. Please contact an administrator if you believe this is an error.`}
        icon={<ShieldAlert className="h-8 w-8 text-amber-600" />}
        iconBg="bg-amber-100"
        action={
          <Button onClick={() => setView('home')}>
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Button>
        }
      />
    )
  }

  return <PortalShell user={user} />
}

// ============================================================
// Portal shell (sidebar + topbar + content)
// ============================================================
function PortalShell({ user }: { user: AuthUser }) {
  const [activeId, setActiveId] = useState<string>('overview')

  const visibleModules = useMemo(
    () => ADMIN_MODULES.filter((m) => m.permission === null || canDo(user, m.permission)),
    [user]
  )

  // Derive the effective active module. If the user's permissions changed and
  // the previously-active module is no longer visible, fall back to the first
  // visible module. We compute this during render rather than via an effect,
  // which avoids cascading re-renders (and the `set-state-in-effect` rule).
  const active = useMemo(
    () => visibleModules.find((m) => m.id === activeId) ?? visibleModules[0],
    [visibleModules, activeId]
  )

  const permCount = user.roles.includes('SUPER_ADMIN')
    ? ALL_PERMISSIONS.length
    : user.permissions.length

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Admin Portal</h1>
            <p className="text-xs text-muted-foreground">Particle-level RBAC dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {user.roleLabels.map((label) => (
            <Badge key={label} variant="secondary" className="rounded-full">
              {label}
            </Badge>
          ))}
          <Badge className="rounded-full">
            <Sparkles className="h-3 w-3" /> {permCount} permissions
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <SidebarNav
              modules={visibleModules}
              activeId={active.id}
              onSelect={setActiveId}
            />
          </div>
        </aside>

        {/* Mobile horizontal nav (above content) */}
        <div className="lg:hidden -mx-3 px-3 overflow-x-auto no-scrollbar order-first">
          <div className="flex gap-2 pb-2 min-w-max">
            {visibleModules.map((m) => {
              const Icon = ICON_MAP[m.icon] || LayoutDashboard
              const isActive = m.id === active.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveId(m.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0 lg:col-start-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ModuleRenderer module={active} user={user} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function SidebarNav({ modules, activeId, onSelect }: {
  modules: typeof ADMIN_MODULES
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <nav className="rounded-2xl border bg-card p-2 shadow-sm">
      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Modules ({modules.length})
      </p>
      <ul className="space-y-0.5">
        {modules.map((m) => {
          const Icon = ICON_MAP[m.icon] || LayoutDashboard
          const isActive = m.id === activeId
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full inline-flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{m.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ============================================================
// Module dispatcher
// ============================================================
function ModuleRenderer({ module, user }: {
  module: (typeof ADMIN_MODULES)[number]
  user: AuthUser
}) {
  switch (module.id) {
    case 'overview': return <OverviewModule user={user} />
    case 'users': return <UsersModule user={user} />
    case 'roles': return <RolesModule user={user} />
    case 'restaurants': return <RestaurantsModule user={user} />
    case 'orders': return <OrdersModule user={user} />
    case 'riders': return <RidersModule user={user} />
    case 'coupons': return <CouponsModule user={user} />
    case 'analytics': return <AnalyticsModule user={user} />
    case 'settings': return <SettingsModule user={user} />
    default: return <GenericModuleShell module={module} user={user} />
  }
}

// ============================================================
// Shared building blocks
// ============================================================
function AccessDeniedCard({ title, description, action, icon, iconBg }: {
  title: string
  description: string
  action: ReactNode
  icon?: ReactNode
  iconBg?: string
}) {
  return (
    <div className="mx-auto max-w-md py-16 px-4">
      <Card className="rounded-2xl">
        <CardContent className="p-8 flex flex-col items-center text-center gap-4">
          <div className={cn('rounded-full p-3', iconBg || 'bg-destructive/10')}>
            {icon || <Lock className="h-8 w-8 text-destructive" />}
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          {action}
        </CardContent>
      </Card>
    </div>
  )
}

function ModuleHeader({ title, description, icon: Icon, action }: {
  title: string
  description: string
  icon: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

function ParticleScopeBanner({ user, module: mod }: { user: AuthUser; module: string }) {
  const all = permissionsForModule(mod)
  const granted = all.filter((a) => canDo(user, a)).length
  const total = all.length
  const pct = total > 0 ? Math.round((granted / total) * 100) : 0
  return (
    <div className="mb-4 rounded-xl border bg-primary/5 px-3 py-2 flex items-center gap-2 text-xs flex-wrap">
      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="font-medium shrink-0">Particle-level scope:</span>
      <span className="text-muted-foreground">
        You have <span className="font-semibold text-foreground">{granted} of {total}</span> actions in the <span className="font-medium text-foreground">{mod}</span> module ({pct}%).
      </span>
    </div>
  )
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-8 flex flex-col items-center text-center gap-3">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function BusySpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
}

// ============================================================
// Overview module
// ============================================================
function OverviewModule({ user }: { user: AuthUser }) {
  const [reloadToken, setReloadToken] = useState(0)
  return (
    <div>
      <ModuleHeader
        title="Overview"
        description="Aggregate KPIs across the platform — always visible."
        icon={LayoutDashboard}
        action={
          <Button size="sm" variant="outline" onClick={() => setReloadToken((t) => t + 1)}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        }
      />
      <OverviewBody key={reloadToken} user={user} />
    </div>
  )
}

function OverviewBody({ user }: { user: AuthUser }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/admin/stats')
      .then(async (r) => {
        if (!mounted) return
        if (r.status === 403) {
          setForbidden(true)
          setLoading(false)
          return
        }
        const json = await r.json()
        if (!mounted) return
        if (json.success) {
          setStats(json.stats as AdminStats)
        } else {
          setError(json.error || 'Failed to load stats')
        }
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Network error')
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (forbidden) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-amber-100 p-3">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold">Analytics access required</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            The overview dashboard pulls from <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/admin/stats</code>,
            which requires the <code className="rounded bg-muted px-1 py-0.5 text-xs">analytics.read</code> permission.
            Your role doesn&apos;t include it, so charts and KPIs are hidden.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) return <ErrorCard message={error} />

  const kpis = stats ? [
    { label: 'Total users', value: formatCount(stats.totalUsers), icon: Users, hint: `${stats.activeUsers} active` },
    { label: 'Restaurants', value: formatCount(stats.totalRestaurants), icon: Store, hint: 'Onboarded' },
    { label: 'Total orders', value: formatCount(stats.totalOrders), icon: Receipt, hint: 'Lifetime' },
    { label: 'Riders', value: formatCount(stats.totalRiders), icon: Bike, hint: 'Partners' },
    { label: 'Revenue', value: formatINR(stats.revenue), icon: CreditCard, hint: 'Delivered' },
    { label: 'Delivered', value: formatCount(stats.deliveredOrders), icon: CheckCircle2, hint: 'Completed' },
    { label: 'Cancelled', value: formatCount(stats.cancelledOrders), icon: XCircle, hint: 'Lifetime' },
    { label: 'Coupons', value: formatCount(stats.totalCoupons), icon: Ticket, hint: 'Active' },
  ] : []

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <motion.div
                key={kpi.label}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              >
                <Card className="rounded-2xl h-full">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-primary/10 p-1.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.hint}</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </>
        ) : stats ? (
          <>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Orders by status</CardTitle>
                <CardDescription>Distribution of all orders across statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={Object.entries(stats.ordersByStatus).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <RTooltip />
                    <Bar dataKey="value" fill="oklch(0.75 0.165 58)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Users by role</CardTitle>
                <CardDescription>How many users hold each role</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    layout="vertical"
                    data={Object.entries(stats.usersByRole).map(([name, value]) => ({ name, value }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <RTooltip />
                    <Bar dataKey="value" fill="oklch(0.7 0.15 90)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user.name || user.phone}</span> &middot; {user.roleLabels.join(', ')}
      </p>
    </div>
  )
}

// ============================================================
// Users module
// ============================================================
function UsersModule({ user }: { user: AuthUser }) {
  const [reloadToken, setReloadToken] = useState(0)
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div>
      <ModuleHeader
        title="Users"
        description="Manage user accounts, roles, and active status."
        icon={Users}
        action={
          canDo(user, 'users.create') ? (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add user
            </Button>
          ) : null
        }
      />
      <ParticleScopeBanner user={user} module="users" />
      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => setReloadToken((t) => t + 1)}
      />
      <UsersBody
        key={reloadToken}
        user={user}
        onMutated={() => setReloadToken((t) => t + 1)}
      />
    </div>
  )
}

function UsersBody({ user, onMutated }: { user: AuthUser; onMutated: () => void }) {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [editing, setEditing] = useState<UserListItem | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/admin/users')
      .then(async (r) => {
        if (!mounted) return
        if (r.status === 403) {
          setForbidden(true)
          setLoading(false)
          return
        }
        const json = await r.json()
        if (!mounted) return
        if (json.success) setUsers(json.users as UserListItem[])
        else setError(json.error || 'Failed to load users')
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Network error')
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const toggleActive = async (u: UserListItem) => {
    setBusyId(u.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update')
      toast.success(`User ${!u.isActive ? 'activated' : 'deactivated'}`)
      onMutated()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update user')
    } finally {
      setBusyId(null)
    }
  }

  const deleteUser = async (u: UserListItem) => {
    setBusyId(u.id)
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(u.id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete')
      toast.success('User deleted')
      onMutated()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete user')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (forbidden) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You lack the <code className="rounded bg-muted px-1 py-0.5 text-xs">users.read</code> permission.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) return <ErrorCard message={error} />

  if (users.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No users found.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === user.id
                  const isBusy = busyId === u.id
                  const canEdit = canDo(user, 'users.update')
                  const canDelete = canDo(user, 'users.delete')
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5 min-w-[160px]">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.name || 'Unnamed'}</p>
                            {isSelf && <span className="text-[10px] text-muted-foreground">(you)</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{u.phone}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{u.email || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {u.roles.map((r) => (
                            <Badge key={r.name} variant="outline" className="text-[10px]">
                              {r.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{timeAgo(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              aria-label="Edit roles"
                              disabled={isBusy}
                              onClick={() => setEditing(u)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              aria-label={u.isActive ? 'Deactivate user' : 'Activate user'}
                              disabled={isBusy || isSelf}
                              onClick={() => toggleActive(u)}
                            >
                              {isBusy ? <BusySpinner /> : <Power className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              aria-label="Delete user"
                              disabled={isBusy || isSelf}
                              onClick={() => deleteUser(u)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!canEdit && !canDelete && (
                            <span className="text-xs text-muted-foreground px-2">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditRolesDialog
        target={editing}
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null) }}
        onSaved={() => { setEditing(null); onMutated() }}
      />
    </>
  )
}

function AddUserDialog({ open, onOpenChange, onSaved }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<string[]>(['CUSTOMER'])
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setPhone('')
    setName('')
    setEmail('')
    setRoles(['CUSTOMER'])
  }

  const toggleRole = (r: string) => {
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
  }

  const submit = async () => {
    if (!phone.trim()) {
      toast.error('Phone is required')
      return
    }
    if (roles.length === 0) {
      toast.error('Select at least one role')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          roles,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create user')
      toast.success('User created')
      reset()
      onOpenChange(false)
      onSaved()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a new user account and assign roles. Requires <code className="rounded bg-muted px-1 py-0.5 text-xs">users.create</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="au-phone">Phone <span className="text-destructive">*</span></Label>
            <Input id="au-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-name">Name</Label>
            <Input id="au-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="au-email">Email</Label>
            <Input id="au-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scroll-thin pr-1">
              {ROLES.map((r) => (
                <Label
                  key={r.name}
                  htmlFor={`au-role-${r.name}`}
                  className="flex items-start gap-2 rounded-lg border p-2 cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    id={`au-role-${r.name}`}
                    checked={roles.includes(r.name)}
                    onCheckedChange={() => toggleRole(r.name)}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-tight">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{r.description}</p>
                  </div>
                </Label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <BusySpinner /> : <Plus className="h-4 w-4" />} Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditRolesDialog({ target, open, onOpenChange, onSaved }: {
  target: UserListItem | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [roles, setRoles] = useState<string[]>(() => target?.roles.map((r) => r.name) ?? [])
  const [prevTarget, setPrevTarget] = useState<UserListItem | null>(target)
  // React-recommended "adjust state during render" — avoids setState-in-effect.
  if (target !== prevTarget) {
    setPrevTarget(target)
    setRoles(target?.roles.map((r) => r.name) ?? [])
  }
  const [busy, setBusy] = useState(false)

  const toggleRole = (r: string) => {
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
  }

  const submit = async () => {
    if (!target) return
    if (roles.length === 0) {
      toast.error('Select at least one role')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, roles }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update roles')
      toast.success('Roles updated')
      onOpenChange(false)
      onSaved()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update roles')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit roles — {target?.name || target?.phone}</DialogTitle>
          <DialogDescription>
            Toggle the roles assigned to this user. Requires <code className="rounded bg-muted px-1 py-0.5 text-xs">users.update</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
          {ROLES.map((r) => (
            <Label
              key={r.name}
              htmlFor={`er-role-${r.name}`}
              className="flex items-start gap-2 rounded-lg border p-2 cursor-pointer hover:bg-accent"
            >
              <Checkbox
                id={`er-role-${r.name}`}
                checked={roles.includes(r.name)}
                onCheckedChange={() => toggleRole(r.name)}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{r.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{r.description}</p>
              </div>
            </Label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <BusySpinner /> : <Pencil className="h-4 w-4" />} Save roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Roles & Permissions module
// ============================================================
function RolesModule({ user }: { user: AuthUser }) {
  const [reloadToken, setReloadToken] = useState(0)
  return (
    <div>
      <ModuleHeader
        title="Roles & Permissions"
        description="Inspect and manage the particle-level permission matrix."
        icon={ShieldCheck}
      />
      <ParticleScopeBanner user={user} module="roles" />
      <RolesBody key={reloadToken} user={user} onMutated={() => setReloadToken((t) => t + 1)} />
    </div>
  )
}

function RolesBody({ user, onMutated }: { user: AuthUser; onMutated: () => void }) {
  const [roles, setRoles] = useState<RoleListItem[]>([])
  const [perms, setPerms] = useState<PermissionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetch('/api/admin/roles').then(async (r) => ({ status: r.status, json: await r.json() })),
      fetch('/api/admin/permissions').then(async (r) => ({ status: r.status, json: await r.json() })),
    ])
      .then(([rolesRes, permsRes]) => {
        if (!mounted) return
        if (rolesRes.status === 403 || permsRes.status === 403) {
          setForbidden(true)
          setLoading(false)
          return
        }
        if (rolesRes.json.success) setRoles(rolesRes.json.roles as RoleListItem[])
        if (permsRes.json.success) {
          setPerms(permsRes.json.permissions as PermissionListItem[])
        }
        if (!rolesRes.json.success) setError(rolesRes.json.error || 'Failed to load roles')
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Network error')
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (forbidden) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You lack the <code className="rounded bg-muted px-1 py-0.5 text-xs">roles.read</code> permission.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) return <ErrorCard message={error} />

  return (
    <>
      <Tabs defaultValue="by-role">
        <TabsList>
          <TabsTrigger value="by-role">By Role</TabsTrigger>
          <TabsTrigger value="by-perm">By Permission</TabsTrigger>
        </TabsList>

        <TabsContent value="by-role">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles.map((role) => {
              const grouped = groupByModule(role.permissions)
              const isSuperAdmin = role.name === 'SUPER_ADMIN'
              const canEditThis = canDo(user, 'roles.update') && !isSuperAdmin
              return (
                <Card key={role.id} className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {role.label}
                      {isSuperAdmin && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Lock className="h-3 w-3" /> Immutable
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span><strong className="text-foreground">{role.userCount}</strong> users</span>
                      <span>&middot;</span>
                      <span><strong className="text-foreground">{role.permissions.length}</strong> permissions</span>
                    </div>
                    <Separator />
                    <div className="space-y-2 max-h-48 overflow-y-auto scroll-thin pr-1">
                      {Object.keys(grouped).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No permissions assigned.</p>
                      ) : (
                        Object.entries(grouped).map(([mod, ps]) => (
                          <div key={mod}>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{mod}</p>
                            <div className="flex flex-wrap gap-1">
                              {ps.map((p) => (
                                <Badge key={p.action} variant="outline" className="text-[10px]">
                                  {p.action.split('.').pop()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {canEditThis ? (
                      <Button size="sm" variant="outline" className="w-full" onClick={() => setEditingRole(role)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit permissions
                      </Button>
                    ) : isSuperAdmin ? (
                      <p className="text-[10px] text-muted-foreground text-center">
                        SUPER_ADMIN always has every permission and cannot be edited.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="by-perm">
          <Card className="rounded-2xl">
            <CardContent className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.action}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.module}</Badge></TableCell>
                        <TableCell className="font-medium">{p.label}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-xs">{p.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {p.roles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              p.roles.map((r) => (
                                <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditPermissionsDialog
        role={editingRole}
        open={!!editingRole}
        onOpenChange={(o) => { if (!o) setEditingRole(null) }}
        onSaved={() => { setEditingRole(null); onMutated() }}
      />
    </>
  )
}

function EditPermissionsDialog({ role, open, onOpenChange, onSaved }: {
  role: RoleListItem | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<string[]>(() => role?.permissions.map((p) => p.action) ?? [])
  const [prevRole, setPrevRole] = useState<RoleListItem | null>(role)
  // React-recommended "adjust state during render" — avoids setState-in-effect.
  if (role !== prevRole) {
    setPrevRole(role)
    setSelected(role?.permissions.map((p) => p.action) ?? [])
  }
  const [busy, setBusy] = useState(false)

  const toggle = (action: string) => {
    setSelected((prev) => prev.includes(action) ? prev.filter((x) => x !== action) : [...prev, action])
  }

  const submit = async () => {
    if (!role) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: role.name, permissions: selected }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update')
      toast.success(`Permissions updated for ${role.label}`)
      onOpenChange(false)
      onSaved()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update permissions')
    } finally {
      setBusy(false)
    }
  }

  const grouped = groupByModule(PERMISSIONS)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit permissions — {role?.label}</DialogTitle>
          <DialogDescription>
            Toggle particle-level permissions. {selected.length} of {PERMISSIONS.length} selected.
            Requires <code className="rounded bg-muted px-1 py-0.5 text-xs">roles.update</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto scroll-thin pr-1 space-y-4">
          {Object.entries(grouped).map(([mod, ps]) => (
            <div key={mod}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{mod}</p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setSelected((prev) => Array.from(new Set([...prev, ...ps.map((p) => p.action)])))}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => setSelected((prev) => prev.filter((a) => !ps.some((p) => p.action === a)))}
                  >
                    None
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {ps.map((p) => (
                  <Label
                    key={p.action}
                    htmlFor={`ep-${p.action}`}
                    className="flex items-start gap-2 rounded-lg border p-2 cursor-pointer hover:bg-accent"
                  >
                    <Checkbox
                      id={`ep-${p.action}`}
                      checked={selected.includes(p.action)}
                      onCheckedChange={() => toggle(p.action)}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-tight">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 font-mono">{p.action}</p>
                    </div>
                  </Label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <BusySpinner /> : <ShieldCheck className="h-4 w-4" />} Save permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Restaurants module
// ============================================================
function RestaurantsModule({ user }: { user: AuthUser }) {
  return (
    <div>
      <ModuleHeader
        title="Restaurants"
        description="Onboard and manage restaurant partners."
        icon={Store}
        action={
          canDo(user, 'restaurants.create') ? (
            <Button size="sm" onClick={() => toast.info('Demo: would open restaurant editor')}>
              <Plus className="h-3.5 w-3.5" /> Add restaurant
            </Button>
          ) : null
        }
      />
      <ParticleScopeBanner user={user} module="restaurants" />
      <RestaurantsBody user={user} />
    </div>
  )
}

function RestaurantsBody({ user }: { user: AuthUser }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/restaurants')
      .then(async (r) => {
        if (!mounted) return
        const json = await r.json()
        if (!mounted) return
        if (json.success) setRestaurants(json.restaurants as Restaurant[])
        else setError(json.error || 'Failed to load restaurants')
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Network error')
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (loading) return <Skeleton className="h-64 rounded-2xl" />
  if (error) return <ErrorCard message={error} />

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Cuisine</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Cost for two</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map((r) => {
                const canEdit = canDo(user, 'restaurants.update')
                const canDelete = canDo(user, 'restaurants.delete')
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.cuisine}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{r.rating.toFixed(1)} ★</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatINR(r.costForTwo)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.deliveryTime} min</TableCell>
                    <TableCell>
                      {r.isActive ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label="Edit restaurant"
                            onClick={() => toast.info(`Demo: would edit ${r.name}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label="Delete restaurant"
                            onClick={() => toast.info(`Demo: would delete ${r.name}`)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!canEdit && !canDelete && (
                          <span className="text-xs text-muted-foreground px-2">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Orders module
// ============================================================
function OrdersModule({ user }: { user: AuthUser }) {
  return (
    <div>
      <ModuleHeader
        title="Orders"
        description="Browse orders and cancel if needed (particle-level)."
        icon={Receipt}
      />
      <ParticleScopeBanner user={user} module="orders" />
      <OrdersBody user={user} />
    </div>
  )
}

function OrdersBody({ user }: { user: AuthUser }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/orders')
      .then(async (r) => {
        if (!mounted) return
        const json = await r.json()
        if (!mounted) return
        if (json.success) setOrders(json.orders as Order[])
        else setError(json.error || 'Failed to load orders')
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Network error')
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (loading) return <Skeleton className="h-64 rounded-2xl" />
  if (error) return <ErrorCard message={error} />

  if (orders.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No orders visible to you.
        </CardContent>
      </Card>
    )
  }

  const canCancel = canDo(user, 'orders.cancel')

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.orderCode}</TableCell>
                  <TableCell className="font-medium">{o.restaurant?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', orderStatusColor(o.status))}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatINR(o.total)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{o.paymentMethod}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{timeAgo(o.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {canCancel ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => toast.info(`Demo: would cancel ${o.orderCode}`)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground px-2">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Riders module
// ============================================================
function RidersModule({ user }: { user: AuthUser }) {
  return (
    <div>
      <ModuleHeader
        title="Riders"
        description="Manage delivery partners."
        icon={Bike}
        action={
          canDo(user, 'riders.create') ? (
            <Button size="sm" onClick={() => toast.info('Demo: would open rider onboarding')}>
              <Plus className="h-3.5 w-3.5" /> Add rider
            </Button>
          ) : null
        }
      />
      <ParticleScopeBanner user={user} module="riders" />
      <RidersBody />
    </div>
  )
}

function RidersBody() {
  const [riderCount, setRiderCount] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/admin/stats')
      .then(async (r) => {
        if (!mounted) return
        if (r.status === 403) return
        const json = await r.json()
        if (!mounted) return
        if (json.success) setRiderCount(json.stats.totalRiders as number)
      })
      .catch(() => { /* swallow — this is a best-effort enrichment */ })
    return () => { mounted = false }
  }, [])

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-8 flex flex-col items-center text-center gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <Bike className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Riders module — coming soon</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            The dedicated riders list API isn&apos;t wired up yet.
            {riderCount !== null && (
              <> The platform currently has <strong className="text-foreground">{riderCount}</strong> delivery partners.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Coupons module
// ============================================================
function CouponsModule({ user }: { user: AuthUser }) {
  return (
    <div>
      <ModuleHeader
        title="Coupons"
        description="Promotional codes and discounts."
        icon={Ticket}
        action={
          canDo(user, 'coupons.create') ? (
            <Button size="sm" onClick={() => toast.info('Demo: would open coupon editor')}>
              <Plus className="h-3.5 w-3.5" /> Add coupon
            </Button>
          ) : null
        }
      />
      <ParticleScopeBanner user={user} module="coupons" />
      <CouponsBody user={user} />
    </div>
  )
}

function CouponsBody({ user }: { user: AuthUser }) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/coupons')
      .then(async (r) => {
        if (!mounted) return
        const json = await r.json()
        if (!mounted) return
        if (json.success) setCoupons(json.coupons as Coupon[])
        else setError(json.error || 'Failed to load coupons')
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Network error')
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (loading) return <Skeleton className="h-64 rounded-2xl" />
  if (error) return <ErrorCard message={error} />

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min order</TableHead>
                <TableHead>Max discount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => {
                const canEdit = canDo(user, 'coupons.update')
                const canDelete = canDo(user, 'coupons.delete')
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground text-xs">{c.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{c.type}</Badge></TableCell>
                    <TableCell className="tabular-nums">{c.type === 'PERCENTAGE' ? `${c.value}%` : formatINR(c.value)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatINR(c.minOrder)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{c.maxDiscount ? formatINR(c.maxDiscount) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label="Edit coupon"
                            onClick={() => toast.info(`Demo: would edit ${c.code}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label="Delete coupon"
                            onClick={() => toast.info(`Demo: would delete ${c.code}`)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!canEdit && !canDelete && (
                          <span className="text-xs text-muted-foreground px-2">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Analytics module
// ============================================================
function AnalyticsModule({ user }: { user: AuthUser }) {
  // Mock revenue trend data (we only have aggregate revenue in the stats API).
  const revenueData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((d, i) => ({
      day: d,
      revenue: 45000 + Math.round(Math.sin(i * 0.8) * 12000) + i * 3500,
      orders: 180 + Math.round(Math.cos(i * 0.6) * 40) + i * 5,
    }))
  }, [])

  return (
    <div>
      <ModuleHeader
        title="Analytics"
        description="Revenue and order trends across the platform."
        icon={BarChart3}
      />
      <ParticleScopeBanner user={user} module="analytics" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Revenue trend (7 days)</CardTitle>
            <CardDescription>Illustrative mock data — wire to a real time-series API when available</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.75 0.165 58)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.75 0.165 58)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip formatter={(v: number) => formatINR(v)} />
                <Area type="monotone" dataKey="revenue" stroke="oklch(0.75 0.165 58)" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Order volume (7 days)</CardTitle>
            <CardDescription>Daily order count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="orders" fill="oklch(0.7 0.15 90)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// Settings module
// ============================================================
function SettingsModule({ user }: { user: AuthUser }) {
  const canEdit = canDo(user, 'settings.update')
  return (
    <div>
      <ModuleHeader
        title="Settings"
        description="Platform configuration and operational zones."
        icon={Settings}
      />
      <ParticleScopeBanner user={user} module="settings" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Platform settings</CardTitle>
            <CardDescription>Global service fee, delivery radius, support SLA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service fee</span>
              <span className="font-medium">5%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Default delivery radius</span>
              <span className="font-medium">7 km</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Support SLA</span>
              <span className="font-medium">30 min</span>
            </div>
            <Separator />
            <Button
              size="sm"
              variant="outline"
              disabled={!canEdit}
              onClick={() => toast.info('Demo: would open platform settings editor')}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit settings
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">City zones</CardTitle>
            <CardDescription>Configure serviceable areas per city</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bangalore</span>
              <span className="font-medium">12 zones</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mumbai</span>
              <span className="font-medium">8 zones</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delhi</span>
              <span className="font-medium">10 zones</span>
            </div>
            <Separator />
            <Button
              size="sm"
              variant="outline"
              disabled={!canEdit}
              onClick={() => toast.info('Demo: would open city zones editor')}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit zones
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// Generic module shell (payments, settlements, campaigns, reviews, tickets)
// ============================================================
function GenericModuleShell({ module, user }: {
  module: (typeof ADMIN_MODULES)[number]
  user: AuthUser
}) {
  const Icon = ICON_MAP[module.icon] || LayoutDashboard
  const moduleName = module.permission?.split('.')[0] || module.id
  const all = permissionsForModule(moduleName)
  const createAction = all.find((a) => a.endsWith('.create'))
  const updateAction = all.find((a) => a.endsWith('.update'))
  const deleteAction = all.find((a) => a.endsWith('.delete'))
  const otherActions = all.filter(
    (a) => a !== createAction && a !== updateAction && a !== deleteAction && !a.endsWith('.read')
  )
  const granted = all.filter((a) => canDo(user, a)).length

  return (
    <div>
      <ModuleHeader
        title={module.name}
        description={`Gated by \`${module.permission}\` — you have access.`}
        icon={Icon}
      />
      <ParticleScopeBanner user={user} module={moduleName} />

      <Card className="rounded-2xl">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-semibold">{module.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This module is gated by <code className="rounded bg-muted px-1 py-0.5 text-xs">{module.permission}</code>.
              Particle-level actions below are shown or hidden based on your role&apos;s permissions.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {createAction && canDo(user, createAction) && (
              <Button size="sm" onClick={() => toast.info(`Demo: would create (requires ${createAction})`)}>
                <Plus className="h-3.5 w-3.5" /> Create
              </Button>
            )}
            {updateAction && canDo(user, updateAction) && (
              <Button size="sm" variant="outline" onClick={() => toast.info(`Demo: would edit (requires ${updateAction})`)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {deleteAction && canDo(user, deleteAction) && (
              <Button size="sm" variant="destructive" onClick={() => toast.info(`Demo: would delete (requires ${deleteAction})`)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
            {otherActions.filter((a) => canDo(user, a)).map((a) => (
              <Button
                key={a}
                size="sm"
                variant="secondary"
                onClick={() => toast.info(`Demo: action "${a}"`)}
              >
                {a.split('.').pop()}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Showing {granted} of {all.length} particle actions for this module.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
