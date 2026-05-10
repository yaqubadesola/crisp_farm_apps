'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, type UserRole } from '@/lib/auth'
import {
  LayoutDashboard, ShoppingCart, Package, Users, CreditCard,
  TrendingDown, RefreshCw, Wheat, DollarSign, BarChart3,
  ClipboardList, Settings, LogOut, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  roles?: UserRole[]
}

const nav: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/sales/new',    label: 'New Sale',       icon: ShoppingCart,  roles: ['ADMIN', 'SALES_OFFICER', 'FARM_MANAGER'] },
  { href: '/sales',        label: 'Sales History',  icon: ClipboardList, roles: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT', 'FARM_MANAGER'] },
  { href: '/customers',    label: 'Customers',      icon: Users,         roles: ['ADMIN', 'SALES_OFFICER', 'FARM_MANAGER'] },
  { href: '/debts',        label: 'Debts',          icon: CreditCard,    roles: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT', 'FARM_MANAGER'] },
  { href: '/expenses',     label: 'Expenses',       icon: TrendingDown,  roles: ['ADMIN', 'ACCOUNTANT', 'FARM_MANAGER'] },
  { href: '/cycles',       label: 'Farm Cycles',    icon: RefreshCw,     roles: ['ADMIN', 'FARM_MANAGER'] },
  { href: '/inventory',    label: 'Inventory',      icon: Wheat,         roles: ['ADMIN', 'FARM_MANAGER'] },
  { href: '/reports',      label: 'Reports',        icon: BarChart3,     roles: ['ADMIN', 'ACCOUNTANT', 'FARM_MANAGER'] },
  { href: '/pricing',      label: 'Pricing',        icon: DollarSign,    roles: ['ADMIN'] },
  { href: '/users',        label: 'Users',          icon: Settings,      roles: ['ADMIN'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, hasRole } = useAuth()
  const [open, setOpen] = useState(false)

  const visible = nav.filter((item) => !item.roles || hasRole(...item.roles))

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const sidebarContent = (
    <aside className={cn(
      'w-60 h-screen bg-brand-950 text-white flex flex-col',
      // Mobile: fixed drawer sliding from left
      'fixed top-0 left-0 z-50 transition-transform duration-200 ease-in-out',
      open ? 'translate-x-0' : '-translate-x-full',
      // Desktop: always visible, part of normal flow
      'md:relative md:translate-x-0 md:shrink-0',
    )}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-brand-800 flex items-center justify-between">
        <div>
          <p className="text-lg font-bold">CrispFarm</p>
          <p className="text-brand-400 text-xs mt-0.5">{user?.tenantName}</p>
        </div>
        {/* Close button — mobile only */}
        <button
          className="md:hidden text-brand-400 hover:text-white transition-colors p-1"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-brand-800">
        <p className="text-sm font-medium truncate">{user?.fullName}</p>
        <p className="text-brand-400 text-xs mt-0.5">{user?.role?.replace('_', ' ')}</p>
        <button
          onClick={handleLogout}
          className="mt-3 flex items-center gap-2 text-brand-300 hover:text-white text-sm transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-brand-950 text-white flex items-center gap-3 px-4 py-3 border-b border-brand-800">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="text-brand-200 hover:text-white transition-colors"
        >
          <Menu size={22} />
        </button>
        <span className="font-bold text-base">CrispFarm</span>
      </header>

      {/* ── Backdrop overlay (mobile only) ─────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar drawer / desktop rail ──────────────────────── */}
      {sidebarContent}
    </>
  )
}
