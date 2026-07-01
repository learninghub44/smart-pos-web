import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken'],

  // ── Security headers ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stop MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS protection for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy — no camera/mic/geolocation by default
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS — enforce HTTPS for 1 year (only applies over HTTPS in prod)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Content Security Policy — allows same-origin + Google Fonts + WhatsApp/Paystack
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.paystack.co https://wa.me",
              "frame-src https://js.paystack.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // ── Redirects ─────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect bare root to dashboard (Layout handles auth)
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
