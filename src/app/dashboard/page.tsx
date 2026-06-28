'use client'

import { useEffect, useState } from 'react'
import { getCurrentAuthUser } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import Link from 'next/link'
import { ShoppingCart, ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData]       = useState<any>({ stats: {}, recent: [], topProducts: [] })
  const { t, fmt, language }  = useI18n()

  useEffect(() => {
    getCurrentAuthUser().then(u => setUser(u))
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const { stats = {}, recent = [], topProducts = [] } = data
  const pct = (n: number) => `${(n || 0) >= 0 ? '+' : ''}${(n || 0).toFixed(1)}%`

  const kpis = [
    { label: t('today_revenue'),    value: fmt(stats.todayRevenue),   sub: pct(stats.revenueGrowth),                       up: (stats.revenueGrowth || 0) >= 0 },
    { label: t('today_sales'),      value: stats.todaySales ?? '—',   sub: `${stats.avgItems ?? 0} ${t('items_per_sale')}`, up: true },
    { label: t('avg_transaction'),  value: fmt(stats.avgTransaction), sub: t('per_sale_today'),                            up: true },
    { label: t('month_revenue'),    value: fmt(stats.monthRevenue),   sub: pct(stats.monthGrowth),                         up: (stats.monthGrowth || 0) >= 0 },
    { label: t('low_stock'),        value: stats.lowStock ?? 0,       sub: t('need_reorder'),                              up: (stats.lowStock || 0) === 0 },
    { label: t('out_of_stock'),     value: stats.outOfStock ?? 0,     sub: t('items_unavailable'),                         up: (stats.outOfStock || 0) === 0 },
  ]

  const locale = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : language === 'sw' ? 'sw-KE' : 'en-KE'

  return (
    <div className="xl-page">
      {/* Toolbar */}
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">{t('dashboard')}</span>
        <div className="xl-toolbar-sep" />
        <span style={{ fontSize: 12, color: 'var(--txt-3)', fontWeight: 500 }}>
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <div style={{ flex: 1 }} />
        <Link href="/pos" className="btn btn-primary">
          <ShoppingCart size={13} /> {t('open_pos')}
        </Link>
      </div>

      <div className="xl-page-inner">
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span>{t('loading')}</span>
          </div>
        ) : (
          <>
            {/* Alerts */}
            {((stats.lowStock || 0) > 0 || (stats.outOfStock || 0) > 0) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {(stats.lowStock || 0) > 0 && (
                  <Link href="/inventory" className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0, textDecoration: 'none' }}>
                    <AlertTriangle size={13} /> {stats.lowStock} products low on stock — click to restock
                    <ArrowRight size={12} />
                  </Link>
                )}
                {(stats.outOfStock || 0) > 0 && (
                  <Link href="/inventory" className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0, textDecoration: 'none' }}>
                    <AlertTriangle size={13} /> {stats.outOfStock} items out of stock
                    <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            )}

            {/* KPI Row */}
            <div className="xl-kpi-row">
              {kpis.map(k => (
                <div key={k.label} className="xl-kpi">
                  <div className="xl-kpi-label">{k.label}</div>
                  <div className="xl-kpi-value">{k.value}</div>
                  <div className={`xl-kpi-sub ${k.up ? 'xl-kpi-up' : 'xl-kpi-down'}`}>
                    {k.up
                      ? <TrendingUp size={11} style={{ display: 'inline', marginRight: 3 }} />
                      : <TrendingDown size={11} style={{ display: 'inline', marginRight: 3 }} />
                    }
                    {k.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid row: recent sales + top products */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

              {/* Recent Sales */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--surface)',
                  borderBottom: '1px solid var(--border)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    {t('sales_history')}
                  </span>
                  <Link href="/sales-history" className="btn btn-ghost" style={{ height: 26, fontSize: 12, padding: '0 10px' }}>
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="xl-grid-wrap" style={{ borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
                  <table className="xl-grid">
                    <thead>
                      <tr>
                        <th className="row-num">#</th>
                        <th>Receipt</th>
                        <th>Time</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th className="num">Amount</th>
                        <th>Payment</th>
                        <th>Cashier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', color: 'var(--txt-3)', height: 80, fontSize: 13 }}>
                            No sales today yet
                          </td>
                        </tr>
                      ) : recent.map((s: any, i: number) => (
                        <tr key={s.id}>
                          <td className="row-num">{i + 1}</td>
                          <td className="font-mono" style={{ fontSize: 12 }}>{s.receipt_pin}</td>
                          <td className="muted">{new Date(s.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{s.customer_name || '—'}</td>
                          <td className="num">{s.item_count || s.items?.length || '—'}</td>
                          <td className="num fw-700">{Math.round(Number(s.total_amount)).toLocaleString()}</td>
                          <td>
                            <span className={`badge badge-${s.payment_method === 'cash' ? 'green' : 'blue'}`}>
                              {s.payment_method}
                            </span>
                          </td>
                          <td className="muted truncate">{s.cashier_name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Products */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--surface)',
                  borderBottom: '1px solid var(--border)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>Top Products</span>
                  <Link href="/reports" className="btn btn-ghost" style={{ height: 26, fontSize: 12, padding: '0 10px' }}>
                    {t('reports')} <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="xl-grid-wrap" style={{ borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
                  <table className="xl-grid">
                    <thead>
                      <tr>
                        <th className="row-num">#</th>
                        <th>Product</th>
                        <th className="num">Sold</th>
                        <th className="num">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--txt-3)', height: 80, fontSize: 13 }}>
                            No data yet
                          </td>
                        </tr>
                      ) : topProducts.map((p: any, i: number) => (
                        <tr key={p.product_id}>
                          <td className="row-num">{i + 1}</td>
                          <td className="truncate">{p.product_name}</td>
                          <td className="num">{p.qty_sold}</td>
                          <td className="num fw-700">{Math.round(Number(p.revenue)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="xl-statusbar">
        <span className="xl-statusbar-item">Smart POS</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">
          {t('today_sales')}: <strong>{stats.todaySales || 0}</strong>
        </span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">
          {t('today_revenue')}: <strong>{fmt(stats.todayRevenue)}</strong>
        </span>
      </div>
    </div>
  )
}
