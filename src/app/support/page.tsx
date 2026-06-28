'use client'

import { useState } from 'react'
import { Phone, MessageCircle, HelpCircle, Clock } from 'lucide-react'

const PHONE = '+254701059192'
const WA_NUMBER = '254701059192'

const FAQ = [
  { q: 'How do I upgrade my plan?', a: 'Go to Billing & Subscription from the sidebar, choose a plan, and pay via M-Pesa. Your plan upgrades instantly on payment confirmation.' },
  { q: 'My M-Pesa payment went through but my plan didn\'t upgrade', a: 'This usually resolves within 5 minutes. If not, send us the M-Pesa confirmation SMS reference via WhatsApp and we\'ll fix it immediately.' },
  { q: 'How do I add more branches or users?', a: 'Upgrade to a higher plan. Go to Billing → choose Business or Enterprise plan.' },
  { q: 'Can I get a receipt or invoice for my payment?', a: 'Yes. All payments appear under Billing → Payment History. Contact support for a formal VAT invoice.' },
  { q: 'How do I reset a staff member\'s password?', a: 'Go to Settings → Staff, click on the staff member, and use the Reset Password option.' },
  { q: 'Can I export my sales data?', a: 'Yes. Go to Reports, filter by date range, and use the Export button to download a CSV.' },
]

const TICKET_CATEGORIES = [
  { value: 'billing',   label: 'Billing & Payments' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'account',   label: 'Account Access' },
  { value: 'feature',   label: 'Feature Request' },
  { value: 'other',     label: 'Other' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border-md)',
  padding: '7px 10px',
  fontSize: 13,
  color: 'var(--txt-1)',
  background: 'var(--surface)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default function SupportPage() {
  const [form, setForm]           = useState({ name: '', email: '', category: 'billing', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq]     = useState<number | null>(null)

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
    <div style={{ padding: '16px 20px' }}>

      {/* ── Toolbar / title row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <HelpCircle size={15} color="var(--xl-green)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt-1)' }}>Customer Support</span>
        <span style={{ fontSize: 13, color: 'var(--txt-3)', marginLeft: 4 }}>— reach us by phone or WhatsApp, Mon–Sat 8am–8pm EAT</span>
      </div>

      {/* ── Main grid: left col + right col ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 12, alignItems: 'start' }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Contact card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {/* Card header */}
            <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} color="var(--txt-2)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Call or WhatsApp</span>
            </div>

            <div style={{ padding: '16px 14px' }}>
              {/* Phone number */}
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt-1)', letterSpacing: '0.01em' }}>{PHONE}</div>
                <div style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 2 }}>Zetu Business Solutions · Kenya</div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href={`tel:${PHONE}`} style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '9px 0', background: 'var(--blue-lt)', border: '1px solid var(--blue)', color: 'var(--blue-dk)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' }}>
                    <Phone size={14} /> Call Now
                  </button>
                </a>
                <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '9px 0', background: '#e6f9ee', border: '1px solid #25D366', color: '#0d6e38', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' }}>
                    <MessageCircle size={14} /> Open WhatsApp Chat
                  </button>
                </a>
              </div>

              {/* Hours */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10, fontSize: 12, color: 'var(--txt-3)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <Clock size={12} /> Mon–Sat, 8am–8pm EAT
              </div>
            </div>
          </div>

          {/* Response times */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '6px 12px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Response Times</span>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { color: '#25D366', label: 'WhatsApp', time: 'Under 30 minutes', icon: MessageCircle },
                { color: 'var(--blue)', label: 'Phone call', time: 'Immediate during hours', icon: Phone },
              ].map(({ color, label, time, icon: Icon }, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                  <Icon size={16} color={color} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-1)' }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>Response time: {time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Ticket form */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageCircle size={13} color="var(--txt-2)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Submit a Support Ticket via WhatsApp</span>
            </div>

            <div style={{ padding: '14px 16px' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>✓ WhatsApp opened!</div>
                  <div style={{ fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: 14 }}>
                    Your ticket message was pre-filled. Just hit Send in WhatsApp and we&apos;ll get back to you within 30 minutes.
                  </div>
                  <button onClick={() => setSubmitted(false)} style={{ ...inputStyle, width: 'auto', padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}>
                    Submit another ticket
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: 5 }}>Your Name</label>
                      <input style={inputStyle} placeholder="e.g. John Kamau" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: 5 }}>Email (optional)</label>
                      <input style={inputStyle} placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: 5 }}>Category</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: 5 }}>
                      Describe your issue <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
                      placeholder="Tell us what's happening. Include any error messages, order numbers, or M-Pesa references if relevant."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={handleSubmit}
                      disabled={!form.message.trim()}
                      style={{ padding: '9px 20px', background: form.message.trim() ? '#e6f9ee' : 'var(--surface-2)', border: `1px solid ${form.message.trim() ? '#25D366' : 'var(--border)'}`, color: form.message.trim() ? '#0d6e38' : 'var(--txt-3)', fontWeight: 700, fontSize: 13, cursor: form.message.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}
                    >
                      <MessageCircle size={14} /> Send via WhatsApp
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>Opens WhatsApp with your ticket pre-filled — just hit send.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FAQ */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={13} color="var(--txt-2)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Frequently Asked Questions</span>
            </div>
            <div>
              {FAQ.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: openFaq === i ? 'var(--surface-2)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-1)' }}>{faq.q}</span>
                    <span style={{ color: 'var(--xl-green)', flexShrink: 0, fontSize: 16, fontWeight: 700 }}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 14px 12px 14px', fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.65 }}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
