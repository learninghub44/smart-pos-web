'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentAuthUser, logout } from '@/lib/auth'
import {
  LayoutDashboard, ShoppingCart, Package, Receipt,
  LogOut, Menu, X, Store, Settings, Users, Truck,
  FileText, TrendingUp, GitBranch
} from 'lucide-react'

const NAV = [
  { name: 'Dashboard',    href: '/dashboard',     icon: LayoutDashboard, admin: false },
  { name: 'POS',          href: '/pos',            icon: ShoppingCart,    admin: false },
  { name: 'Inventory',    href: '/inventory',      icon: Package,         admin: true  },
  { name: 'Customers',    href: '/customers',      icon: Users,           admin: true  },
  { name: 'Suppliers',    href: '/suppliers',      icon: Truck,           admin: true  },
  { name: 'Sales History',href: '/sales-history',  icon: FileText,        admin: false },
  { name: 'Receipts',     href: '/receipts',       icon: Receipt,         admin: false },
  { name: 'Reports',      href: '/reports',        icon: TrendingUp,      admin: true  },
  { name: 'Branches',     href: '/branches',       icon: GitBranch,       admin: true  },
  { name: 'Settings',     href: '/settings',       icon: Settings,        admin: true  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<any>(null)
  const [open, setOpen]           = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => { checkAuth() }, [pathname])
  useEffect(() => { setOpen(false) }, [pathname])

  const checkAuth = async () => {
    const u = await getCurrentAuthUser()
    if (!u && pathname !== '/login') router.push('/login')
    else setUser(u)
  }

  const handleLogout = async () => { await logout(); router.push('/login') }

  const nav = NAV.filter(n => !n.admin || user?.role === 'admin')

  if (pathname === '/login') return <>{children}</>

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── Overlay ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
            zIndex:40, display:'none'
          }}
          className="lg-overlay"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 220,
          background: 'var(--sidebar-bg)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 50,
          transition: 'transform .25s ease',
        }}
        className="sidebar"
      >
        {/* Logo */}
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'20px 16px 16px',
          borderBottom:'1px solid rgba(255,255,255,.07)'
        }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:'var(--blue)',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0
          }}>
            <Store size={16} color="#fff" />
          </div>
          <div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:13, lineHeight:1.2 }}>Smart POS</p>
            <p style={{ color:'var(--txt-3)', fontSize:11 }}>v2.0</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding:'12px 8px', flex:1 }}>
          <p style={{
            fontSize:10, fontWeight:700, color:'#4B5563',
            letterSpacing:'.08em', textTransform:'uppercase',
            padding:'4px 8px 8px'
          }}>Menu</p>

          {nav.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.name} href={item.href} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 10px', borderRadius:8, marginBottom:2,
                textDecoration:'none', transition:'background .12s',
                background: active ? 'var(--sidebar-actbg)' : 'transparent',
                color: active ? 'var(--sidebar-act)' : 'var(--sidebar-txt)',
                fontWeight: active ? 600 : 400, fontSize:13
              }}>
                <Icon size={15} style={{ flexShrink:0, opacity: active ? 1 : .7 }} />
                {item.name}
                {active && (
                  <span style={{
                    marginLeft:'auto', width:4, height:4,
                    borderRadius:'50%', background:'var(--blue)'
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{
          padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,.07)'
        }}>
          <div style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'8px 10px', marginBottom:4
          }}>
            <div style={{
              width:30, height:30, borderRadius:'50%',
              background:'#374151',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0
            }}>
              <span style={{ color:'#D1D5DB', fontSize:12, fontWeight:700 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ color:'#E5E7EB', fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ color:'#6B7280', fontSize:11, textTransform:'capitalize' }}>{user?.role}</p>
            </div>
          </div>

          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:8,
            width:'100%', padding:'8px 10px', borderRadius:8,
            background:'transparent', border:'none', cursor:'pointer',
            color:'#EF4444', fontSize:12, fontWeight:500, transition:'background .12s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background='rgba(239,68,68,.1)')}
          onMouseLeave={e => (e.currentTarget.style.background='transparent')}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        {/* Topbar */}
        <header style={{
          height:56, background:'var(--surface)',
          borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center',
          padding:'0 20px', gap:12, flexShrink:0,
          boxShadow:'0 1px 0 var(--border)'
        }}>
          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(o => !o)}
            className="mobile-menu-btn"
            style={{
              display:'none', padding:6, borderRadius:6,
              background:'none', border:'none', cursor:'pointer',
              color:'var(--txt-2)'
            }}
          >
            <Menu size={20} />
          </button>

          {/* Page name */}
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:15, fontWeight:700, color:'var(--txt-1)', lineHeight:1 }}>
              {nav.find(n => n.href === pathname)?.name || 'Smart POS'}
            </p>
          </div>

          {/* Right */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              padding:'4px 12px', borderRadius:99,
              background:'var(--blue-lt)', color:'var(--blue)',
              fontSize:11, fontWeight:700
            }}>
              {new Date().toLocaleDateString('en-KE', { day:'numeric', month:'short' })}
            </div>
            <div style={{
              width:32, height:32, borderRadius:'50%',
              background:'var(--blue-lt)',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <span style={{ color:'var(--blue)', fontSize:12, fontWeight:700 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:'auto', padding:'24px' }}>
          {children}
        </main>
      </div>

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 1023px) {
          .sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            transform: ${open ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          .lg-overlay { display: block !important; }
          .mobile-menu-btn { display: flex !important; }
          main { padding: 16px !important; }
        }
      `}</style>
    </div>
  )
}
