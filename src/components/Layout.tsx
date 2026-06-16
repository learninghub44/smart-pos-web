'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentAuthUser, logout, getActiveBranchId, setActiveBranchId, isOwner } from '@/lib/auth'
import {
  LayoutDashboard, ShoppingCart, Package, Receipt, LogOut, Menu, X,
  ShoppingBag, Settings, Users, Truck, FileText, TrendingUp, RefreshCw,
  Tag, Layers, ClipboardList, Building2, ChevronDown, CheckCircle2
} from 'lucide-react'

const allNavigation = [
  { name: 'Dashboard',        href: '/dashboard',        icon: LayoutDashboard, ownerOnly: false },
  { name: 'POS',              href: '/pos',              icon: ShoppingCart,    ownerOnly: false },
  { name: 'Inventory',        href: '/inventory',        icon: Package,         ownerOnly: false },
  { name: 'Inventory Count',  href: '/inventory-count',  icon: ClipboardList,   ownerOnly: false },
  { name: 'Sales History',    href: '/sales-history',    icon: FileText,        ownerOnly: false },
  { name: 'Receipts',         href: '/receipts',         icon: Receipt,         ownerOnly: false },
  { name: 'Returns',          href: '/returns',          icon: RefreshCw,       ownerOnly: false },
  { name: 'Customers',        href: '/customers',        icon: Users,           ownerOnly: false },
  { name: 'Suppliers',        href: '/suppliers',        icon: Truck,           ownerOnly: false },
  { name: 'Categories',       href: '/categories',       icon: Layers,          ownerOnly: false },
  { name: 'Brands',           href: '/brands',           icon: Tag,             ownerOnly: false },
  { name: 'Reports',          href: '/reports',          icon: TrendingUp,      ownerOnly: false },
  { name: 'Branches',         href: '/branches',         icon: Building2,       ownerOnly: true  },
  { name: 'Settings',         href: '/settings',         icon: Settings,        ownerOnly: false },
]

interface Branch { id: string; name: string; location: string | null; is_active: boolean }

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [activeBranchId, setLocalBranchId] = useState<string | null>(null)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentAuthUser()
    if (!currentUser && pathname !== '/login') {
      router.push('/login')
    } else {
      setUser(currentUser)
      setLocalBranchId(getActiveBranchId())
      if (currentUser && isOwner(currentUser)) loadBranches()
    }
  }, [pathname])

  const loadBranches = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('branches').select('id,name,location,is_active').eq('is_active', true).order('name')
      if (data) setBranches(data)
    } catch (_) {}
  }

  const switchBranch = (branchId: string | null) => {
    setActiveBranchId(branchId)
    setLocalBranchId(branchId)
    setBranchDropdownOpen(false)
    // Reload page to re-fetch data for new branch
    router.refresh()
  }

  const handleLogout = async () => { await logout(); router.push('/login') }

  if (pathname === '/login') return <>{children}</>

  const owner = isOwner(user)
  const navigation = allNavigation.filter(n => !n.ownerOnly || owner)
  const activeBranch = branches.find(b => b.id === activeBranchId)
  const branchLabel = user?.branch_name || activeBranch?.name || (owner ? 'All Branches' : '')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
        flex flex-col transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-gray-900 text-sm leading-tight">Smart POS</div>
              <div className="text-[10px] font-medium text-blue-600 leading-tight truncate">Zetu Business Solutions</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Switcher (owner only) */}
        {owner && (
          <div className="px-3 py-2 border-b border-gray-100 relative">
            <button
              onClick={() => setBranchDropdownOpen(o => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="flex-1 text-left text-sm font-semibold text-blue-700 truncate">{branchLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-blue-500 transition-transform flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {branchDropdownOpen && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => switchBranch(null)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <span className="flex-1 font-medium text-gray-700 text-left">All Branches</span>
                  {!activeBranchId && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </button>
                {branches.map(b => (
                  <button key={b.id}
                    onClick={() => switchBranch(b.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors border-t border-gray-50"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-800 truncate">{b.name}</p>
                      {b.location && <p className="text-xs text-gray-400 truncate">{b.location}</p>}
                    </div>
                    {activeBranchId === b.id && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cashier branch badge */}
        {!owner && user?.branch_name && (
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl">
              <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-700 truncate">{user.branch_name}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" onClick={() => setBranchDropdownOpen(false)}>
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{owner ? 'Owner' : user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 p-1">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {navigation.find(n => n.href === pathname)?.name || 'Smart POS'}
            </h1>
          </div>
          {/* Branch context pill in topbar */}
          {branchLabel && (
            <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              <Building2 className="w-3 h-3" />
              {branchLabel}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500 hidden sm:flex">
            <span className="font-medium text-gray-700">{user?.name}</span>
            <span>·</span>
            <span className="capitalize">{owner ? 'Owner' : user?.role}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6" onClick={() => setBranchDropdownOpen(false)}>
          {children}
        </main>
      </div>
    </div>
  )
}
