import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Lightweight liveness check — no DB dependency so the platform healthcheck never fails
  // due to DB connectivity issues
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
