'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentAuthUser, logout, isAdmin } from '@/lib/auth'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Receipt, 
  LogOut, 
  Menu,
  X,
  Store,
  Settings,
  Users,
  Truck,
  FileText,
  TrendingUp,
  ChevronRight
} from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const checkAuth = async () => {
    const currentUser = await getCurrentAuthUser()
    if (!currentUser && pathname !== '/login') {
      router.push('/login')
    } else {
      setUser(currentUser)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'POS', href: '/pos', icon: ShoppingCart, adminOnly: false },
    { name: 'Inventory', href: '/inventory', icon: Package, adminOnly: true },
    { name: 'Customers', href: '/customers', icon: Users, adminOnly: true },
    { name: 'Suppliers', href: '/suppliers', icon: Truck, adminOnly: true },
    { name: 'Sales History', href: '/sales-history', icon: FileText, adminOnly: false },
    { name: 'Receipts', href: '/receipts', icon: Receipt, adminOnly: false },
    { name: 'Reports', href: '/reports', icon: TrendingUp, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
  ]

  const visibleNav = navigation.filter(item => !item.adminOnly || user?.role === 'admin')

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">SMART POS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {visibleNav.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-blue-400" />}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-100 p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 flex-shrink-0 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page breadcrumb on mobile */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate lg:hidden">
              {visibleNav.find(n => n.href === pathname)?.name || 'SMART POS'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
