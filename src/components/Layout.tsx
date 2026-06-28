'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentAuthUser, logout } from '@/lib/auth'
import {
  LayoutDashboard, ShoppingCart, Package, Receipt,
  LogOut, Menu, X, Store, Settings, Users, Truck,
  FileText, TrendingUp, GitBranch, Tag, Layers, RotateCcw,
  CreditCard, LifeBuoy
} from 'lucide-react'

const PUBLIC_PAGES = ['/', '/login', '/register']

const NAV_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
      { name: 'POS',           href: '/pos',            icon: ShoppingCart },
      { name: 'Sales History', href: '/sales-history',  icon: FileText },
      { name: 'Returns',       href: '/returns',        icon: RotateCcw },
      { name: 'Receipts',      href: '/receipts',       icon: Receipt },
    ]
  },
  {
    label: 'Inventory',
    adminOnly: true,
    items: [
      { name: 'Inventory',   href: '/inventory',   icon: Package },
      { name: 'Categories',  href: '/categories',  icon: Layers },
      { name: 'Brands',      href: '/brands',      icon: Tag },
      { name: 'Suppliers',   href: '/suppliers',   icon: Truck },
    ]
  },
  {
    label: 'Customers & Analytics',
    adminOnly: true,
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Reports',   href: '/reports',   icon: TrendingUp },
      { name: 'Branches',  href: '/branches',  icon: GitBranch },
      { name: 'Settings',  href: '/settings',  icon: Settings },
    ]
  },
  {
    label: 'Account',
    adminOnly: true,
    items: [
      { name: 'Billing',  href: '/billing', icon: CreditCard },
      { name: 'Support',  href: '/support', icon: LifeBuoy },
    ]
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<any>(null)
  const [open, setOpen]   = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  const isPublicPage = PUBLIC_PAGES.includes(pathname)

  useEffect(() => {
    if (!isPublicPage) checkAuth()
  }, [pathname])

  useEffect(() => { setOpen(false) }, [pathname])

  const checkAuth = async () => {
    const u = await getCurrentAuthUser()
    if (!u) router.push('/login')
    else setUser(u)
  }

  const handleLogout = async () => { await logout(); router.push('/login') }

  // Public pages render without sidebar
  if (isPublicPage) return <>{children}</>

  const initials = user?.name?.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2) || '??'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {open && (
        <div onClick={() => setOpen(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:40
        }} />
      )}

      <aside className="sidebar" style={{
        position: 'relative',
        zIndex: 50,
        transform: open ? 'translateX(0)' : undefined,
        transition: 'transform .2s',
      }}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Store size={16} color="var(--xl-green)" />
          </div>
          <div>
            <div className="sidebar-brand-name">Smart POS</div>
            <div className="sidebar-brand-sub">Zetu Business</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            if (section.adminOnly && user?.role !== 'admin' && user?.role !== 'owner') return null
            return (
              <div key={section.label}>
                <div className="sidebar-nav-label">{section.label}</div>
                {section.items.map(item => {
                  const Icon = item.icon
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link key={item.href} href={item.href} className={`sidebar-nav-item${active?' active':''}`}>
                      <Icon size={14} />
                      {item.name}
                    </Link>
                  )
                })}
                <div className="sidebar-nav-sep" />
              </div>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user?.name || 'Loading…'}</div>
              <div className="sidebar-user-role">{user?.role || ''}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ width:'100%', color:'rgba(255,255,255,.6)', borderColor:'rgba(255,255,255,.15)' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'var(--xl-green)', borderBottom:'1px solid var(--xl-green-hover)' }}
             className="mobile-topbar">
          <button onClick={()=>setOpen(!open)} className="btn btn-ghost" style={{ color:'#fff', borderColor:'rgba(255,255,255,.2)' }}>
            {open ? <X size={16}/> : <Menu size={16}/>}
          </button>
          <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Smart POS</span>
        </div>

        {children}
      </main>

      <style>{`
        .mobile-topbar { display: none; }
        @media (max-width: 768px) {
          .sidebar { position: fixed; left: 0; top: 0; bottom: 0; transform: translateX(-100%); }
          .sidebar[style*="translateX(0)"] { transform: translateX(0) !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
