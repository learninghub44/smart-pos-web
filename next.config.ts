import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'bcryptjs', 'jsonwebtoken'],
  // Trust Railway's reverse proxy (fixes https redirects behind load balancer)
  experimental: {
    trustHostHeader: true,
  },
}

export default nextConfig;
