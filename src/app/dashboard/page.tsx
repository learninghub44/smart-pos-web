'use client'

import { useEffect, useState } from 'react'
import { getCurrentAuthUser } from '@/lib/auth'
import Link from 'next/link'
import { DollarSign, ShoppingCart, TrendingUp, Activity, AlertTriangle, Package, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ stats:{}, recent:[], topProducts:[] })

  useEffect(() => {
    getCurrentAuthUser().then(u => setUser(u))
    fetch('/api/dashboard').then(r=>r.json()).then(d=>{ setData(d); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const { stats={}, recent=[], topProducts=[] } = data
  const fmt = (n: number) => `KES ${Math.round(n||0).toLocaleString()}`
  const pct = (n: number) => `${(n||0)>=0?'+':''}${(n||0).toFixed(1)}%`

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240 }}>
      <div style={{ width:36, height:36, border:'3px solid var(--blue)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth:1280, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--txt-1)', marginBottom:2 }}>
            Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize:13, color:'var(--txt-3)' }}>{new Date().toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <Link href="/pos" style={{ display:'flex', alignItems:'center', gap:8, background:'var(--blue)', color:'#fff', padding:'10px 18px', borderRadius:'var(--radius-sm)', textDecoration:'none', fontSize:13, fontWeight:700, flexShrink:0 }}>
          <ShoppingCart size={15}/> Open POS
        </Link>
      </div>

      {(stats.lowStock>0||stats.outOfStock>0)&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:10, marginBottom:20 }}>
          {stats.lowStock>0&&(<Link href="/inventory" style={{ display:'flex', alignItems:'center', gap:12, background:'var(--yellow-lt)', border:'1px solid #FDE68A', borderRadius:'var(--radius)', padding:'12px 14px', textDecoration:'none' }}>
            <AlertTriangle size={16} color="var(--yellow)" style={{ flexShrink:0 }}/>
            <div style={{ flex:1 }}><p style={{ fontSize:12, fontWeight:700, color:'#92400E' }}>{stats.lowStock} products low on stock</p><p style={{ fontSize:11, color:'#B45309' }}>Tap to restock</p></div>
            <ArrowRight size={14} color="var(--yellow)"/>
          </Link>)}
          {stats.outOfStock>0&&(<Link href="/inventory" style={{ display:'flex', alignItems:'center', gap:12, background:'var(--red-lt)', border:'1px solid #FECACA', borderRadius:'var(--radius)', padding:'12px 14px', textDecoration:'none' }}>
            <Package size={16} color="var(--red)" style={{ flexShrink:0 }}/>
            <div style={{ flex:1 }}><p style={{ fontSize:12, fontWeight:700, color:'#991B1B' }}>{stats.outOfStock} products out of stock</p><p style={{ fontSize:11, color:'#B91C1C' }}>Cannot be sold</p></div>
            <ArrowRight size={14} color="var(--red)"/>
          </Link>)}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:"Today's Revenue", value:fmt(stats.todayRevenue), sub:pct(stats.revenueChange)+' vs yesterday', up:(stats.revenueChange||0)>=0, icon:DollarSign, accent:'var(--blue)', bg:'var(--blue-lt)' },
          { label:"Today's Sales", value:(stats.todaySales||0).toString(), sub:pct(stats.salesChange)+' vs yesterday', up:(stats.salesChange||0)>=0, icon:ShoppingCart, accent:'var(--green)', bg:'var(--green-lt)' },
          { label:"Today's Profit", value:fmt(stats.todayProfit), sub:'Revenue minus cost', up:(stats.todayProfit||0)>=0, icon:TrendingUp, accent:'var(--purple)', bg:'var(--purple-lt)' },
          { label:'Avg Transaction', value:fmt(stats.averageTx), sub:'Per sale today', up:true, icon:Activity, accent:'var(--orange)', bg:'var(--orange-lt)' },
        ].map(card=>{
          const Icon=card.icon
          return (
            <div key={card.label} className="stat-card">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:6 }}>{card.label}</p>
                  <p style={{ fontSize:20, fontWeight:800, color:'var(--txt-1)', lineHeight:1.1, marginBottom:4 }}>{card.value}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    {card.up?<ArrowUpRight size={12} color="var(--green)"/>:<ArrowDownRight size={12} color="var(--red)"/>}
                    <p style={{ fontSize:11, fontWeight:600, color:card.up?'var(--green)':'var(--red)' }}>{card.sub}</p>
                  </div>
                </div>
                <div style={{ width:38, height:38, borderRadius:10, background:card.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={17} color={card.accent}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:20 }}>
        {[
          { label:'Weekly Revenue', value:fmt(stats.weeklyRevenue), sub:'Last 7 days' },
          { label:'Monthly Revenue', value:fmt(stats.monthlyRevenue), sub:'Last 30 days' },
          { label:'Total Products', value:(stats.totalProducts||0).toString(), sub:'In inventory' },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:'14px 16px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{s.label}</p>
            <p style={{ fontSize:17, fontWeight:800, color:'var(--txt-1)', marginBottom:2 }}>{s.value}</p>
            <p style={{ fontSize:11, color:'var(--txt-3)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="dash-bottom">
        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>Recent Sales</p>
            <Link href="/sales-history" style={{ fontSize:11, fontWeight:600, color:'var(--blue)', textDecoration:'none' }}>View all →</Link>
          </div>
          {recent.length===0?(<div className="empty"><ShoppingCart size={28}/><p>No sales yet today</p></div>)
            :recent.map((t: any,i: number)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:i<recent.length-1?'1px solid var(--border)':'none' }}>
              <div><p style={{ fontSize:12, fontWeight:700, color:'var(--txt-1)' }}>{t.pin}</p><p style={{ fontSize:11, color:'var(--txt-3)', marginTop:1 }}>{t.items} item{t.items!==1?'s':''} · {t.time}</p></div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>KES {(t.total||0).toLocaleString()}</p>
                <span className={`badge badge-${t.method==='cash'?'green':t.method==='mpesa'?'blue':t.method==='card'?'purple':'gray'}`} style={{ marginTop:2 }}>{t.method?.replace(/_/g,' ')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>Top Products <span style={{ color:'var(--txt-3)', fontWeight:400 }}>· this month</span></p>
          </div>
          {topProducts.length===0?(<div className="empty"><TrendingUp size={28}/><p>No sales data yet</p></div>)
            :topProducts.map((p: any,i: number)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom:i<topProducts.length-1?'1px solid var(--border)':'none' }}>
              <span style={{ width:24, height:24, borderRadius:6, background:i===0?'var(--blue)':i===1?'var(--blue-lt)':'var(--bg)', color:i===0?'#fff':'var(--txt-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--txt-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                <p style={{ fontSize:11, color:'var(--txt-3)' }}>{p.sold} sold</p>
              </div>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--txt-1)', flexShrink:0 }}>KES {(p.revenue||0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){.dash-bottom{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
