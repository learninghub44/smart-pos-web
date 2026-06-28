import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import Layout from "@/components/Layout"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ZetuPOS — The POS System Built for Kenya | M-Pesa, Multi-Branch, Works Offline",
  description: "ZetuPOS is a modern Point of Sale system for Kenyan shops. M-Pesa integrated, works offline, multi-branch. Start your 14-day free trial today.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
