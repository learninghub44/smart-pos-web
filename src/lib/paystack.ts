// Paystack integration — subscriptions + one-time charges
// Docs: https://paystack.com/docs/api

const BASE = 'https://api.paystack.co'

// Lazy, request-time read — see db.ts / tenant-auth.ts for why this can't
// be a module-scope const on Cloudflare Workers.
function getPaystackSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    throw new Error(
      'PAYSTACK_SECRET_KEY is not set. Set it via `wrangler secret put PAYSTACK_SECRET_KEY` (prod) ' +
      'or in .env.local (dev).'
    )
  }
  return secret
}

async function paystackRequest(method: string, path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

// ── Initialize a payment (monthly or one-time) ─────────────────

export interface InitPaymentOptions {
  email: string
  amountKobo: number             // KES × 100
  reference: string              // unique ref you generate
  callbackUrl: string
  metadata?: Record<string, any>
  planCode?: string              // for recurring Paystack plan
}

export async function initializePayment(opts: InitPaymentOptions) {
  const body: any = {
    email: opts.email,
    amount: opts.amountKobo,
    reference: opts.reference,
    callback_url: opts.callbackUrl,
    currency: 'KES',
    metadata: opts.metadata || {},
  }
  if (opts.planCode) body.plan = opts.planCode
  return paystackRequest('POST', '/transaction/initialize', body)
}

// ── Verify a transaction ───────────────────────────────────────

export async function verifyTransaction(reference: string) {
  return paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`)
}

// ── Create a Paystack plan (monthly recurring) ─────────────────

export async function createOrGetPlan(planId: string, name: string, amountKobo: number) {
  // Check if we have it stored; otherwise create
  const list = await paystackRequest('GET', `/plan?perPage=100`)
  const existing = list.data?.find((p: any) =>
    p.name.toLowerCase().includes(planId.toLowerCase())
  )
  if (existing) return existing

  const res = await paystackRequest('POST', '/plan', {
    name,
    interval: 'monthly',
    amount: amountKobo,
    currency: 'KES',
  })
  return res.data
}

// ── Cancel a subscription ──────────────────────────────────────

export async function cancelSubscription(subCode: string) {
  return paystackRequest('POST', '/subscription/disable', {
    code: subCode,
    token: subCode, // Paystack needs the email_token; handled via webhook in practice
  })
}

// ── Validate a webhook ─────────────────────────────────────────

import crypto from 'crypto'

export function validateWebhook(rawBody: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', getPaystackSecret())
    .update(rawBody)
    .digest('hex')
  return hash === signature
}

// ── Reference generator ────────────────────────────────────────

export function generateRef(tenantId: string, suffix?: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  const prefix = suffix || 'PAY'
  return `SPOS-${prefix}-${ts}-${rand}`
}

// ── Plan → Paystack amount mapping ────────────────────────────

export const PLAN_AMOUNTS: Record<string, { monthly: number; once: number }> = {
  starter:    { monthly: 250 * 100,   once: 0 },
  business:   { monthly: 999 * 100,   once: 0 },
  enterprise: { monthly: 2000 * 100,  once: 0 },
  lifetime:   { monthly: 0,           once: 16000 * 100 },
}
