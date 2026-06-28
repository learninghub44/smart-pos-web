import type { Metadata } from "next"
import "./globals.css"
import Layout from "@/components/Layout"

export const metadata: Metadata = {
  title: "Smart POS — The POS System Built for Kenya | M-Pesa, Multi-Branch, Works Offline",
  description: "Smart POS is a modern Point of Sale system for Kenyan shops. M-Pesa integrated, works offline, multi-branch. Start your 14-day free trial today.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Open Sans', sans-serif" }}>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
