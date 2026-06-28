'use client'

import { useState } from 'react'
import { Phone, MessageCircle, HelpCircle, Clock, CreditCard, AlertCircle, Zap, FileText } from 'lucide-react'

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
  { value: 'billing',   label: 'Billing & Payments' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'account',   label: 'Account Access' },
  { value: 'feature',   label: 'Feature Request' },
  { value: 'other',     label: 'Other' },
]

export default function SupportPage() {
  const [form, setForm]       = useState({ name: '', email: '', category: 'billing', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const buildWhatsAppMessage = () => {
    const lines = [
      `*Smart POS Support Ticket*`, ``,
      `*Name:* ${form.name || 'Not provided'}`,
      `*Email:* ${form.email || 'Not provided'}`,
      `*Category:* ${TICKET_CATEGORIES.find(c => c.value === form.category)?.label || form.category}`,
      ``, `*Issue:*`, form.message,
    ]
    return encodeURIComponent(lines.join('\n'))
  }

  const handleSubmit = () => {
    if (!form.message.trim()) return
    window.open(`https://wa.me/${WA_NUMBER}?text=${buildWhatsAppMessage()}`, '_blank')
    setSubmitted(true)
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <HelpCircle size={18} color="var(--xl-green)" />
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Customer Support</h1>
          <p style={{ fontSize: 11, color: 'var(--txt-3)', margin: 0 }}>We&apos;re here to help — reach us by phone or WhatsApp</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* ── Left: contact ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Phone card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <Phone size={13} color="var(--txt-2)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Call or WhatsApp</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt-1)', letterSpacing: '0.01em', marginBottom: 2 }}>{PHONE}</div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>Zetu Business Solutions · Kenya</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={`tel:${PHONE}`} style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '8px 0', background: 'var(--blue-lt)', border: '1px solid var(--blue)', color: 'var(--blue)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Phone size={13} /> Call Now
                </button>
              </a>
              <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '8px 0', background: '#e8faf0', border: '1px solid #25D366', color: '#128C7E', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <MessageCircle size={13} /> Open WhatsApp Chat
                </button>
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10, fontSize: 11, color: 'var(--txt-3)' }}>
              <Clock size={11} /> Mon–Sat, 8am–8pm EAT
            </div>
          </div>

          {/* Response times */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { color: '#25D366', label: 'WhatsApp', time: 'Under 30 minutes', icon: MessageCircle },
                { color: 'var(--blue)', label: 'Phone call', time: 'Immediate during hours', icon: Phone },
              ].map(({ color, label, time, icon: Icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>Response time: {time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: ticket form ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <MessageCircle size={13} color="var(--txt-2)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Submit a Ticket via WhatsApp</span>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>✓ WhatsApp opened!</div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: 16 }}>
                Your ticket message was pre-filled. Just hit send in WhatsApp and we&apos;ll get back to you within 30 minutes.
              </div>
              <button onClick={() => setSubmitted(false)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--txt-2)', padding: '5px 14px', fontSize: 12, cursor: 'pointer' }}>
                Submit another ticket
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: 4 }}>Your Name</label>
                  <input style={{ width: '100%', border: '1px solid var(--border)', padding: '5px 8px', fontSize: 12, color: 'var(--txt-1)', background: 'var(--surface)', outline: 'none', boxSizing: 'border-box' as const }} placeholder="e.g. John Kamau" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: 4 }}>Email (optional)</label>
                  <input style={{ width: '100%', border: '1px solid var(--border)', padding: '5px 8px', fontSize: 12, color: 'var(--txt-1)', background: 'var(--surface)', outline: 'none', boxSizing: 'border-box' as const }} placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: 4 }}>Category</label>
                <select style={{ width: '100%', border: '1px solid var(--border)', padding: '5px 8px', fontSize: 12, color: 'var(--txt-1)', background: 'var(--surface)', outline: 'none', cursor: 'pointer' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: 4 }}>
                  Describe your issue <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <textarea
                  style={{ width: '100%', border: '1px solid var(--border)', padding: '6px 8px', fontSize: 12, color: 'var(--txt-1)', background: 'var(--surface)', outline: 'none', resize: 'vertical' as const, minHeight: 100, boxSizing: 'border-box' as const }}
                  placeholder="Tell us what's happening. Include any error messages, order numbers, or M-Pesa references if relevant."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.message.trim()}
                style={{ width: '100%', padding: '8px 0', background: form.message.trim() ? '#e8faf0' : 'var(--surface-2)', border: `1px solid ${form.message.trim() ? '#25D366' : 'var(--border)'}`, color: form.message.trim() ? '#128C7E' : 'var(--txt-3)', fontWeight: 700, fontSize: 12, cursor: form.message.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <MessageCircle size={13} /> Send via WhatsApp
              </button>
              <p style={{ fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', margin: 0 }}>
                This opens WhatsApp with your ticket pre-filled. Hit send to submit.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={13} color="var(--txt-2)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Frequently Asked Questions</span>
        </div>
        <div style={{ padding: '4px 0' }}>
          {FAQ.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>{faq.q}</span>
                <span style={{ color: 'var(--txt-3)', flexShrink: 0, fontSize: 14 }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 14px 12px', fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
