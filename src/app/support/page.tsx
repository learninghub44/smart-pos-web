'use client'

import { useState } from 'react'
import { Phone, MessageCircle, HelpCircle, Clock, ChevronDown, ChevronUp, CheckCircle, ArrowRight, Mail } from 'lucide-react'

const PHONE      = '+254 701 059 192'
const WA_NUMBER  = '254701059192'
const EMAIL      = 'support@zetubusiness.co.ke'

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I upgrade my plan?',
    a: 'Go to Billing from the sidebar, choose the plan that fits your business, and pay via M-Pesa. Your account upgrades the moment payment is confirmed.',
  },
  {
    q: 'My M-Pesa payment went through but my plan did not upgrade.',
    a: 'This usually resolves within 5 minutes. If it does not, send the M-Pesa confirmation SMS reference via WhatsApp and we will fix it immediately.',
  },
  {
    q: 'How do I add more branches or staff accounts?',
    a: 'Upgrade to the Business or Enterprise plan under Billing. Once upgraded, go to Settings to add branches and staff.',
  },
  {
    q: 'Can I get a VAT invoice for my payment?',
    a: 'Yes. All payments appear under Billing. Contact support via WhatsApp or email to request a formal VAT invoice — we send it within one business day.',
  },
  {
    q: 'How do I reset a staff member password?',
    a: 'Go to Settings, open the Staff tab, click the staff member, and use the Reset Password option. They will receive a new temporary password.',
  },
  {
    q: 'Can I export my sales data?',
    a: 'Yes. Open Reports, set your date range, then click Export to download a CSV file you can open in Excel or Google Sheets.',
  },
  {
    q: 'Does Smart POS work without internet?',
    a: 'Yes. The POS screen works offline and syncs automatically when your connection is restored. Reports and settings require an active connection.',
  },
  {
    q: 'How do I connect a thermal receipt printer?',
    a: 'Smart POS supports USB and Bluetooth thermal printers. From the POS screen, click the printer icon and follow the pairing steps. 58mm and 80mm paper widths are both supported.',
  },
]

const CATEGORIES = [
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
  const [msgError, setMsgError] = useState(false)

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const buildWaMessage = () => {
    const cat = CATEGORIES.find(c => c.value === form.category)?.label || form.category
    return encodeURIComponent(
      `*Smart POS Support Ticket*\n\nName: ${form.name || 'Not provided'}\nEmail: ${form.email || 'Not provided'}\nCategory: ${cat}\n\nIssue:\n${form.message}`
    )
  }

  const handleSend = () => {
    if (!form.message.trim()) { setMsgError(true); return }
    setMsgError(false)
    window.open(`https://wa.me/${WA_NUMBER}?text=${buildWaMessage()}`, '_blank')
    setSubmitted(true)
  }

  return (
    <div className="xl-page">
      {/* Toolbar */}
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">Support</span>
        <div className="xl-toolbar-sep" />
        <span style={{ fontSize: 12, color: 'var(--txt-3)', fontWeight: 500 }}>
          Mon–Sat, 8am–8pm EAT
        </span>
      </div>

      <div className="xl-page-inner" style={{ maxWidth: 1100 }}>

        {/* ── Hero strip ───────────────────────────────── */}
        <div style={{
          background: 'var(--sidebar-bg)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 36px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>
              Zetu Business Solutions
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: 8, lineHeight: 1.2 }}>
              How can we help you?
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.6, maxWidth: 420 }}>
              We respond to WhatsApp within 30 minutes during business hours. For urgent issues, call directly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={`tel:${PHONE}`} style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 'var(--radius)',
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Phone size={14} /> Call Now
              </button>
            </a>
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 'var(--radius)',
                background: '#25D366', border: '1px solid #1EB85A',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <MessageCircle size={14} /> WhatsApp
              </button>
            </a>
          </div>
        </div>

        {/* ── Two-column layout ────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT: Contact info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Contact card */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-1)', letterSpacing: '-0.01em' }}>
                  Contact Details
                </span>
              </div>
              <div style={{ padding: '16px' }}>

                {/* Phone */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    Phone / WhatsApp
                  </div>
                  <a href={`tel:${PHONE}`} style={{ display: 'block', fontSize: 16, fontWeight: 800, color: 'var(--txt-1)', textDecoration: 'none', letterSpacing: '-0.01em', marginBottom: 2 }}>
                    {PHONE}
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>Kenya — EAT (UTC +3)</div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    Email
                  </div>
                  <a href={`mailto:${EMAIL}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                    {EMAIL}
                  </a>
                </div>

                {/* Hours */}
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                    Business Hours
                  </div>
                  {[
                    { day: 'Monday – Friday', hours: '8:00am – 8:00pm' },
                    { day: 'Saturday',        hours: '9:00am – 6:00pm' },
                    { day: 'Sunday',          hours: 'Closed' },
                  ].map(row => (
                    <div key={row.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--txt-2)', fontWeight: 500 }}>{row.day}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: row.hours === 'Closed' ? 'var(--txt-4)' : 'var(--txt-1)' }}>{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Response times */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-1)', letterSpacing: '-0.01em' }}>Response Times</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {[
                  { icon: MessageCircle, color: '#25D366', label: 'WhatsApp',   time: 'Under 30 min' },
                  { icon: Phone,         color: 'var(--blue)', label: 'Phone',  time: 'Immediate' },
                  { icon: Mail,          color: 'var(--primary)', label: 'Email', time: 'Within 4 hours' },
                ].map(({ icon: Icon, color, label, time }, i, arr) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--radius)',
                      background: 'var(--surface-3)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={14} color={color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-1)' }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Ticket form + FAQ ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Ticket form */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={14} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', letterSpacing: '-0.01em' }}>
                  Send a Support Ticket
                </span>
                <span style={{ fontSize: 12, color: 'var(--txt-3)', marginLeft: 4 }}>— opens WhatsApp with your message pre-filled</span>
              </div>

              <div style={{ padding: '20px' }}>
                {submitted ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'var(--green-lt)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}>
                      <CheckCircle size={24} color="var(--green)" />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt-1)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                      WhatsApp opened
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--txt-3)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 20px' }}>
                      Your ticket was pre-filled in WhatsApp. Just press Send and we will get back to you within 30 minutes during business hours.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', category: 'billing', message: '' }) }}
                      className="btn"
                    >
                      Submit another ticket
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Your Name</label>
                        <input className="input" style={{ width: '100%' }} placeholder="e.g. John Kamau" value={form.name} onChange={e => set('name', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Email <span style={{ color: 'var(--txt-4)', fontWeight: 400 }}>(optional)</span></label>
                        <input className="input" style={{ width: '100%' }} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Category</label>
                      <select className="input" style={{ width: '100%' }} value={form.category} onChange={e => set('category', e.target.value)}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Describe your issue <span style={{ color: 'var(--red)' }}>*</span>
                      </label>
                      <textarea
                        className="input"
                        style={{ width: '100%', minHeight: 120, resize: 'vertical', borderColor: msgError ? 'var(--red)' : undefined }}
                        placeholder="Describe what happened. Include any error messages, receipt numbers, or M-Pesa references."
                        value={form.message}
                        onChange={e => { set('message', e.target.value); if (e.target.value.trim()) setMsgError(false) }}
                      />
                      {msgError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>Please describe your issue before sending.</div>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                      <button
                        onClick={handleSend}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '0 20px', height: 38,
                          background: '#25D366', border: '1px solid #1EB85A',
                          borderRadius: 'var(--radius)', color: '#fff',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <MessageCircle size={14} /> Send via WhatsApp
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--txt-3)', lineHeight: 1.5 }}>
                        Opens WhatsApp — just press Send
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={14} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', letterSpacing: '-0.01em' }}>
                  Frequently Asked Questions
                </span>
              </div>
              <div>
                {FAQ.map((faq, i) => (
                  <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '14px 20px',
                        background: openFaq === i ? 'var(--primary-lt)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                        fontFamily: 'inherit', transition: 'background .1s',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: openFaq === i ? 'var(--primary-txt)' : 'var(--txt-1)', lineHeight: 1.4 }}>
                        {faq.q}
                      </span>
                      {openFaq === i
                        ? <ChevronUp size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                        : <ChevronDown size={14} color="var(--txt-3)" style={{ flexShrink: 0 }} />
                      }
                    </button>
                    {openFaq === i && (
                      <div style={{
                        padding: '0 20px 16px 20px',
                        fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.7,
                        background: 'var(--primary-lt)',
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
