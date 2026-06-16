'use client'

import { useEffect, useState } from 'react'
import { getCurrentAuthUser } from '@/lib/auth'
import Link from 'next/link'
import {
  DollarSign, ShoppingCart, TrendingUp, Activity,
  AlertTriangle, Package, ArrowRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todaySales: 0, todayRevenue: 0, todayProfit: 0,
    weeklyRevenue: 0, monthlyRevenue: 0, averageTx: 0,
    totalProducts: 0, lowStock: 0, outOfStock: 0,
    revenueChange: 0, salesChange: 0,
  })
  const [recent, setRecent] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    ;(async () => { const u = await getCurrentAuthUser(); if (u) setUser(u) })()
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const today    = new Date(); today.setHours(0,0,0,0)
      const yest     = new Date(today); yest.setDate(today.getDate()-1)
      const weekAgo  = new Date(today); weekAgo.setDate(today.getDate()-7)
      const monthAgo = new Date(today); monthAgo.setMonth(today.getMonth()-1)

      const [{ data: sales }, { data: products }] = await Promise.all([
        supabase.from('sales')
          .select('*, sale_items(quantity, price, product_id, products(name, cost_price))')
          .gte('created_at', monthAgo.toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('products')
          .select('id, stock, minimum_stock, name')
          .eq('archived', false)
      ])

      if (!sales || !products) return

      const todaySales  = sales.filter(s => new Date(s.created_at) >= today)
      const yesterdaySales = sales.filter(s => new Date(s.created_at) >= yest && new Date(s.created_at) < today)
      const weeklySales = sales.filter(s => new Date(s.created_at) >= weekAgo)

      const todayRev   = todaySales.reduce((a, s) => a + Number(s.total_amount), 0)
      const yesterdayRev = yesterdaySales.reduce((a, s) => a + Number(s.total_amount), 0)
      const weekRev    = weeklySales.reduce((a, s) => a + Number(s.total_amount), 0)
      const monthRev   = sales.reduce((a, s) => a + Number(s.total_amount), 0)

      let todayCost = 0
      todaySales.forEach(s => s.sale_items?.forEach((i: any) => {
        if (i.products) todayCost += (i.products.cost_price || 0) * i.quantity
      }))

      // Top products
      const pMap = new Map<string, { sold: number; revenue: number }>()
      sales.forEach(s => s.sale_items?.forEach((i: any) => {
        const nm = i.products?.name || 'Unknown'
        const cur = pMap.get(nm) || { sold: 0, revenue: 0 }
        pMap.set(nm, { sold: cur.sold + i.quantity, revenue: cur.revenue + i.price * i.quantity })
      }))

      setStats({
        todaySales: todaySales.length,
        todayRevenue: todayRev,
        todayProfit: todayRev - todayCost,
        weeklyRevenue: weekRev,
        monthlyRevenue: monthRev,
        averageTx: todaySales.length ? todayRev / todaySales.length : 0,
        totalProducts: products.length,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= (p.minimum_stock || 10)).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        revenueChange: yesterdayRev ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : 0,
        salesChange: yesterdaySales.length ? ((todaySales.length - yesterdaySales.length) / yesterdaySales.length) * 100 : 0,
      })

      setRecent(sales.slice(0, 6).map(s => ({
        pin: s.receipt_pin,
        items: s.sale_items?.length || 0,
        total: Number(s.total_amount),
        method: s.payment_method,
        time: new Date(s.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
      })))

      setTopProducts(
        Array.from(pMap.entries())
          .map(([name, d]) => ({ name, ...d }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      )
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fmt = (n: number) => `KES ${Math.round(n).toLocaleString()}`
  const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240 }}>
      <div style={{
        width:36, height:36, border:'3px solid var(--blue)',
        borderTopColor:'transparent', borderRadius:'50%',
        animation:'spin .7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth:1280, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--txt-1)', marginBottom:2 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize:13, color:'var(--txt-3)' }}>
            {new Date().toLocaleDateString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <Link href="/pos" style={{
          display:'flex', alignItems:'center', gap:8,
          background:'var(--blue)', color:'#fff',
          padding:'10px 18px', borderRadius:'var(--radius-sm)',
          textDecoration:'none', fontSize:13, fontWeight:700,
          flexShrink:0, boxShadow:'0 1px 2px rgba(37,99,235,.3)'
        }}>
          <ShoppingCart size={15} />
          Open POS
        </Link>
      </div>

      {/* Alerts */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:10, marginBottom:20 }}>
          {stats.lowStock > 0 && (
            <Link href="/inventory" style={{
              display:'flex', alignItems:'center', gap:12,
              background:'var(--yellow-lt)', border:'1px solid #FDE68A',
              borderRadius:'var(--radius)', padding:'12px 14px',
              textDecoration:'none'
            }}>
              <AlertTriangle size={16} color="var(--yellow)" style={{ flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#92400E' }}>{stats.lowStock} products low on stock</p>
                <p style={{ fontSize:11, color:'#B45309' }}>Tap to restock</p>
              </div>
              <ArrowRight size={14} color="var(--yellow)" />
            </Link>
          )}
          {stats.outOfStock > 0 && (
            <Link href="/inventory" style={{
              display:'flex', alignItems:'center', gap:12,
              background:'var(--red-lt)', border:'1px solid #FECACA',
              borderRadius:'var(--radius)', padding:'12px 14px',
              textDecoration:'none'
            }}>
              <Package size={16} color="var(--red)" style={{ flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#991B1B' }}>{stats.outOfStock} products out of stock</p>
                <p style={{ fontSize:11, color:'#B91C1C' }}>Cannot be sold</p>
              </div>
              <ArrowRight size={14} color="var(--red)" />
            </Link>
          )}
        </div>
      )}

      {/* KPI grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:20 }}>
        {[
          {
            label: "Today's Revenue", value: fmt(stats.todayRevenue),
            sub: pct(stats.revenueChange) + ' vs yesterday',
            up: stats.revenueChange >= 0,
            icon: DollarSign, accent: 'var(--blue)', bg: 'var(--blue-lt)'
          },
          {
            label: "Today's Sales", value: stats.todaySales.toString(),
            sub: pct(stats.salesChange) + ' vs yesterday',
            up: stats.salesChange >= 0,
            icon: ShoppingCart, accent: 'var(--green)', bg: 'var(--green-lt)'
          },
          {
            label: "Today's Profit", value: fmt(stats.todayProfit),
            sub: 'Revenue minus cost',
            up: stats.todayProfit >= 0,
            icon: TrendingUp, accent: 'var(--purple)', bg: 'var(--purple-lt)'
          },
          {
            label: 'Avg Transaction', value: fmt(stats.averageTx),
            sub: 'Per sale today',
            up: true,
            icon: Activity, accent: 'var(--orange)', bg: 'var(--orange-lt)'
          },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="stat-card">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>
                    {card.label}
                  </p>
                  <p style={{ fontSize:20, fontWeight:800, color:'var(--txt-1)', lineHeight:1.1, marginBottom:4 }}>
                    {card.value}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    {card.up
                      ? <ArrowUpRight size={12} color="var(--green)" />
                      : <ArrowDownRight size={12} color="var(--red)" />
                    }
                    <p style={{ fontSize:11, fontWeight:600, color: card.up ? 'var(--green)' : 'var(--red)' }}>
                      {card.sub}
                    </p>
                  </div>
                </div>
                <div style={{
                  width:38, height:38, borderRadius:10,
                  background: card.bg, display:'flex',
                  alignItems:'center', justifyContent:'center', flexShrink:0
                }}>
                  <Icon size={17} color={card.accent} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Secondary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10, marginBottom:20 }}>
        {[
          { label:'Weekly Revenue', value: fmt(stats.weeklyRevenue), sub:'Last 7 days' },
          { label:'Monthly Revenue', value: fmt(stats.monthlyRevenue), sub:'Last 30 days' },
          { label:'Total Products', value: stats.totalProducts.toString(), sub:'In inventory' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'14px 16px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{s.label}</p>
            <p style={{ fontSize:17, fontWeight:800, color:'var(--txt-1)', marginBottom:2 }}>{s.value}</p>
            <p style={{ fontSize:11, color:'var(--txt-3)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent + Top */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="dash-bottom">
        {/* Recent Sales */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'14px 18px', borderBottom:'1px solid var(--border)'
          }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>Recent Sales</p>
            <Link href="/sales-history" style={{
              fontSize:11, fontWeight:600, color:'var(--blue)', textDecoration:'none'
            }}>View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty"><ShoppingCart size={28} /><p>No sales yet today</p></div>
          ) : recent.map((t, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'11px 18px', borderBottom: i < recent.length-1 ? '1px solid var(--border)' : 'none'
            }}>
              <div>
                <p style={{ fontSize:12, fontWeight:700, fontFamily:'monospace', color:'var(--txt-1)' }}>{t.pin}</p>
                <p style={{ fontSize:11, color:'var(--txt-3)', marginTop:1 }}>
                  {t.items} item{t.items !== 1 ? 's' : ''} · {t.time}
                </p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>KES {t.total.toLocaleString()}</p>
                <span className={`badge ${
                  t.method === 'cash' ? 'badge-green' :
                  t.method === 'mpesa' ? 'badge-blue' :
                  t.method === 'card' ? 'badge-purple' : 'badge-gray'
                }`} style={{ marginTop:2 }}>
                  {t.method?.replace(/_/g,' ')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Top Products */}
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>Top Products <span style={{ color:'var(--txt-3)', fontWeight:400 }}>· this month</span></p>
          </div>
          {topProducts.length === 0 ? (
            <div className="empty"><TrendingUp size={28} /><p>No sales data yet</p></div>
          ) : topProducts.map((p, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'11px 18px', borderBottom: i < topProducts.length-1 ? '1px solid var(--border)' : 'none'
            }}>
              <span style={{
                width:24, height:24, borderRadius:6,
                background: i === 0 ? 'var(--blue)' : i === 1 ? 'var(--blue-lt)' : 'var(--bg)',
                color: i === 0 ? '#fff' : 'var(--txt-2)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:800, flexShrink:0
              }}>{i+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--txt-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                <p style={{ fontSize:11, color:'var(--txt-3)' }}>{p.sold} sold</p>
              </div>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--txt-1)', flexShrink:0 }}>KES {p.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dash-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
