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
  title: "Smart POS | Zetu Business Solutions",
  description: "Smart POS — Point of Sale System for Kenyan Shops by Zetu Business Solutions",
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
