'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentAuthUser, logout } from '@/lib/auth'
import { useI18n, LANGUAGES, CURRENCIES } from '@/lib/i18n'
import {
  LayoutDashboard, ShoppingCart, Package, Receipt,
  LogOut, Menu, X, Store, Settings, Users, Truck,
  FileText, TrendingUp, GitBranch, Tag, Layers, RotateCcw,
  CreditCard, LifeBuoy, Globe, ChevronDown, Check
} from 'lucide-react'

const PUBLIC_PAGES = ['/', '/login', '/register']

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<any>(null)
  const [open, setOpen]     = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showCurMenu,  setShowCurMenu]  = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const curRef  = useRef<HTMLDivElement>(null)

  const pathname = usePathname()
  const router   = useRouter()
  const { language, currency, setLanguage, setCurrency, t } = useI18n()

  const isPublicPage = PUBLIC_PAGES.includes(pathname)

  useEffect(() => {
    if (!isPublicPage) checkAuth()
  }, [pathname])

  useEffect(() => { setOpen(false) }, [pathname])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false)
      if (curRef.current  && !curRef.current.contains(e.target as Node))  setShowCurMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const checkAuth = async () => {
    const u = await getCurrentAuthUser()
    if (!u) router.push('/login')
    else {
      setUser(u)
      fetch('/api/tenant/logo').then(r => r.json()).then(d => {
        if (d.logo_url) setLogoUrl(d.logo_url)
      }).catch(() => {})
    }
  }

  const handleLogout = async () => { await logout(); router.push('/login') }

  if (isPublicPage) return <>{children}</>

  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]
  const currentCur  = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]

  const NAV_SECTIONS = [
    {
      label: t('operations'),
      items: [
        { key: 'dashboard',     href: '/dashboard',     icon: LayoutDashboard },
        { key: 'pos',           href: '/pos',            icon: ShoppingCart },
        { key: 'sales_history', href: '/sales-history',  icon: FileText },
        { key: 'returns',       href: '/returns',        icon: RotateCcw },
        { key: 'receipts',      href: '/receipts',       icon: Receipt },
      ]
    },
    {
      label: t('inventory'),
      adminOnly: true,
      items: [
        { key: 'inventory',   href: '/inventory',   icon: Package },
        { key: 'categories',  href: '/categories',  icon: Layers },
        { key: 'brands',      href: '/brands',      icon: Tag },
        { key: 'suppliers',   href: '/suppliers',   icon: Truck },
      ]
    },
    {
      label: t('customers_analytics'),
      adminOnly: true,
      items: [
        { key: 'customers', href: '/customers', icon: Users },
        { key: 'reports',   href: '/reports',   icon: TrendingUp },
        { key: 'branches',  href: '/branches',  icon: GitBranch },
        { key: 'settings',  href: '/settings',  icon: Settings },
      ]
    },
    {
      label: t('account'),
      adminOnly: true,
      items: [
        { key: 'billing',  href: '/billing', icon: CreditCard },
        { key: 'support',  href: '/support', icon: LifeBuoy },
      ]
    },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          backdropFilter: 'blur(2px)', zIndex: 40
        }} />
      )}

      {/* ── Sidebar ────────────────────────────────── */}
      <aside className="sidebar" style={{
        position: 'relative',
        zIndex: 50,
        transform: open ? 'translateX(0)' : undefined,
        transition: 'transform .2s',
      }}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{ overflow: 'hidden', padding: logoUrl ? 0 : undefined }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
              : <Store size={16} color="var(--primary)" />
            }
          </div>
          <div>
            <div className="sidebar-brand-name">Smart POS</div>
            <div className="sidebar-brand-sub">Zetu Business</div>
          </div>
        </div>

        {/* Nav */}
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
                    <Link key={item.href} href={item.href} className={`sidebar-nav-item${active ? ' active' : ''}`}>
                      <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                      {t(item.key)}
                    </Link>
                  )
                })}
                <div className="sidebar-nav-sep" />
              </div>
            )
          })}
        </nav>

        {/* Footer: user + language + currency */}
        <div className="sidebar-footer">
          {/* User row */}
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Loading…'}
              </div>
              <div className="sidebar-user-role">{user?.role || ''}</div>
            </div>
          </div>

          {/* Language + Currency switchers */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>

            {/* Language */}
            <div ref={langRef} style={{ position: 'relative', flex: 1 }}>
              <button
                onClick={() => { setShowLangMenu(v => !v); setShowCurMenu(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 8px', background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--radius-sm)',
                  color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '.01em',
                }}
              >
                <Globe size={11} />
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentLang.name}
                </span>
                <ChevronDown size={10} style={{ flexShrink: 0, opacity: .6 }} />
              </button>
              {showLangMenu && (
                <div style={{
                  position: 'absolute', bottom: '110%', left: 0, right: 0,
                  background: '#252D45', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 'var(--radius)', overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 200,
                }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setShowLangMenu(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '7px 10px', background: 'none',
                        border: 'none', color: lang.code === language ? '#fff' : 'rgba(255,255,255,.6)',
                        fontSize: 12, cursor: 'pointer', fontWeight: lang.code === language ? 700 : 400,
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      {lang.name}
                      {lang.code === language && <Check size={11} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency */}
            <div ref={curRef} style={{ position: 'relative', flex: 1 }}>
              <button
                onClick={() => { setShowCurMenu(v => !v); setShowLangMenu(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 8px', background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--radius-sm)',
                  color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '.01em',
                }}
              >
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentCur.code}
                </span>
                <ChevronDown size={10} style={{ flexShrink: 0, opacity: .6 }} />
              </button>
              {showCurMenu && (
                <div style={{
                  position: 'absolute', bottom: '110%', left: 0, right: 0,
                  background: '#252D45', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 'var(--radius)', overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 200,
                  maxHeight: 220, overflowY: 'auto',
                }}>
                  {CURRENCIES.map(cur => (
                    <button
                      key={cur.code}
                      onClick={() => { setCurrency(cur.code); setShowCurMenu(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '7px 10px', background: 'none',
                        border: 'none', color: cur.code === currency ? '#fff' : 'rgba(255,255,255,.6)',
                        fontSize: 12, cursor: 'pointer', fontWeight: cur.code === currency ? 700 : 400,
                        textAlign: 'left', gap: 6,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span>{cur.symbol}</span>
                      <span style={{ flex: 1 }}>{cur.name}</span>
                      {cur.code === currency && <Check size={11} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sign out */}
          <button onClick={handleLogout} className="btn btn-ghost" style={{
            width: '100%', color: 'rgba(255,255,255,.45)',
            borderColor: 'rgba(255,255,255,.08)', fontSize: 12,
          }}>
            <LogOut size={12} /> {t('sign_out')}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile topbar */}
        <div style={{
          display: 'none', alignItems: 'center', gap: 10,
          padding: '10px 16px', background: 'var(--sidebar-bg)',
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }} className="mobile-topbar">
          <button onClick={() => setOpen(!open)} className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.15)' }}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Smart POS</span>
        </div>

        {children}
      </main>

      <style>{`
        .mobile-topbar { display: none !important; }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed; left: 0; top: 0; bottom: 0;
            transform: translateX(-100%);
          }
          .sidebar[style*="translateX(0)"] { transform: translateX(0) !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
