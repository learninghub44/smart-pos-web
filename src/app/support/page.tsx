'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MessageCircle, HelpCircle, Send, CheckCircle, AlertCircle, Clock, Zap, FileText, CreditCard } from 'lucide-react'

const PHONE = '+254701059192'
const WA_NUMBER = '254701059192'

const FAQ = [
  { q: 'How do I upgrade my plan?', a: 'Go to Billing & Subscription from the sidebar, choose a plan, and pay via M-Pesa. Your plan upgrades instantly on payment confirmation.' },
  { q: 'My M-Pesa payment went through but my plan didn\'t upgrade', a: 'This usually resolves within 5 minutes. If not, send us the M-Pesa confirmation SMS reference via WhatsApp and we\'ll fix it immediately.' },
  { q: 'How do I add more branches or users?', a: 'Upgrade to a higher plan that includes more branches/users. Go to Billing → choose Business or Enterprise plan.' },
  { q: 'Can I get a receipt or invoice for my payment?', a: 'Yes. All payments appear under Billing → Payment History. Contact support to get a formal VAT invoice emailed to you.' },
  { q: 'How do I reset a staff member\'s password?', a: 'Go to Settings → Staff, click on the staff member, and use the Reset Password option. They\'ll receive a new temporary password.' },
  { q: 'Can I export my sales data?', a: 'Yes. Go to Reports, filter by date range, and use the Export button to download a CSV of your sales data.' },
]

const TICKET_CATEGORIES = [
  { value: 'billing', label: '💳 Billing & Payments', icon: CreditCard },
  { value: 'technical', label: '⚙️ Technical Issue', icon: AlertCircle },
  { value: 'account', label: '👤 Account Access', icon: HelpCircle },
  { value: 'feature', label: '✨ Feature Request', icon: Zap },
  { value: 'other', label: '📋 Other', icon: FileText },
]

export default function SupportPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', category: 'billing', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const buildWhatsAppMessage = () => {
    const lines = [
      `*Smart POS Support Ticket*`,
      ``,
      `*Name:* ${form.name || 'Not provided'}`,
      `*Email:* ${form.email || 'Not provided'}`,
      `*Category:* ${TICKET_CATEGORIES.find(c => c.value === form.category)?.label || form.category}`,
      ``,
      `*Issue:*`,
      form.message,
    ]
    return encodeURIComponent(lines.join('\n'))
  }

  const handleSubmit = () => {
    if (!form.message.trim()) return
    const url = `https://wa.me/${WA_NUMBER}?text=${buildWhatsAppMessage()}`
    window.open(url, '_blank')
    setSubmitted(true)
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '2rem', overflowY: 'auto' },
    wrap: { maxWidth: 900, margin: '0 auto' },
    back: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0 },
    header: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' },
    headerIcon: { width: 44, height: 44, background: 'rgba(16,185,129,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    h1: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
    sub: { color: '#64748b', fontSize: '0.85rem', margin: 0 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem' },
    cardTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 },
    label: { fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: '0.35rem' },
    input: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.6rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const },
    textarea: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.6rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', resize: 'vertical' as const, minHeight: 110, boxSizing: 'border-box' as const },
    select: { width: '100%', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.6rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' },
    waBtn: { width: '100%', background: 'linear-gradient(135deg, #25D366, #128C7E)', border: 'none', borderRadius: 10, padding: '0.75rem 1rem', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '0.25rem' },
    phoneBtn: { width: '100%', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 10, padding: '0.75rem 1rem', color: '#93c5fd', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    hours: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', justifyContent: 'center' },
    faqItem: { borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.875rem', marginBottom: '0.875rem' },
    faqQ: { fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, userSelect: 'none' as const },
    faqA: { color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.5rem', lineHeight: 1.6 },
  }

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <button onClick={() => router.back()} style={s.back}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={s.header}>
          <div style={s.headerIcon}><HelpCircle size={22} color="#10b981" /></div>
          <div>
            <h1 style={s.h1}>Customer Support</h1>
            <p style={s.sub}>We're here to help — reach us by phone or WhatsApp</p>
          </div>
        </div>

        <div style={s.grid}>

          {/* Contact options */}
          <div>
            {/* Phone card */}
            <div style={{ ...s.card, marginBottom: '1rem' }}>
              <div style={s.cardTitle}>
                <Phone size={16} color="#3b82f6" /> Call or WhatsApp
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.02em', color: '#f1f5f9', marginBottom: '0.25rem' }}>{PHONE}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>Zetu Business Solutions · Kenya</div>
                <a href={`tel:${PHONE}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '0.625rem' }}>
                  <button style={s.phoneBtn}>
                    <Phone size={16} /> Call Now
                  </button>
                </a>
                <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                  <button style={s.waBtn}>
                    <MessageCircle size={16} /> Open WhatsApp Chat
                  </button>
                </a>
                <div style={s.hours}>
                  <Clock size={12} /> Mon–Sat, 8am–8pm EAT
                </div>
              </div>
            </div>

            {/* Response time info */}
            <div style={{ ...s.card, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { icon: MessageCircle, color: '#25D366', label: 'WhatsApp', time: 'Under 30 minutes' },
                  { icon: Phone, color: '#3b82f6', label: 'Phone call', time: 'Immediate during hours' },
                ].map(({ icon: Icon, color, label, time }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, background: `${color}20`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Response time: {time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket form */}
          <div style={s.card}>
            <div style={s.cardTitle}>
              <Send size={16} color="#8b5cf6" /> Submit a Ticket via WhatsApp
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ width: 56, height: 56, background: 'rgba(37,211,102,0.15)', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CheckCircle size={28} color="#25D366" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>WhatsApp opened!</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Your ticket message was pre-filled. Just hit send in WhatsApp and we'll get back to you within 30 minutes.
                </div>
                <button onClick={() => setSubmitted(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Submit another ticket
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={s.label}>Your Name</label>
                    <input style={s.input} placeholder="e.g. John Kamau" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={s.label}>Email (optional)</label>
                    <input style={s.input} placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label style={s.label}>Category</label>
                  <select style={s.select} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={s.label}>Describe your issue <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea style={s.textarea} placeholder="Tell us what's happening. Include any error messages, order numbers, or M-Pesa references if relevant." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>

                <button onClick={handleSubmit} disabled={!form.message.trim()} style={{ ...s.waBtn, opacity: form.message.trim() ? 1 : 0.5, cursor: form.message.trim() ? 'pointer' : 'not-allowed' }}>
                  <MessageCircle size={18} /> Send via WhatsApp
                </button>
                <p style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', margin: 0 }}>
                  This opens WhatsApp with your ticket pre-filled. Hit send to submit.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div style={s.card}>
          <div style={{ ...s.cardTitle, marginBottom: '1.25rem' }}>
            <HelpCircle size={16} color="#f59e0b" /> Frequently Asked Questions
          </div>
          {FAQ.map((faq, i) => (
            <div key={i} style={{ ...s.faqItem, ...(i === FAQ.length - 1 ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : {}) }}>
              <div style={s.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span style={{ color: '#64748b', flexShrink: 0, fontSize: '1rem' }}>{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && <div style={s.faqA}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
