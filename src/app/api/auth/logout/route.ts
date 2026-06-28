import { NextResponse } from 'next/server'
import { clearCookie } from '@/lib/tenant-auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.set('Set-Cookie', clearCookie())
  return response
}
