import type { Metadata } from "next"
import "./globals.css"
import Layout from "@/components/Layout"
import { I18nProvider } from "@/lib/i18n"

export const metadata: Metadata = {
  title: "Smart POS — The POS System Built for Kenya | M-Pesa, Multi-Branch, Works Offline",
  description: "Smart POS is a modern Point of Sale system for Kenyan shops. M-Pesa integrated, works offline, multi-branch. Start your 14-day free trial today.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider>
          <Layout>{children}</Layout>
        </I18nProvider>
      </body>
    </html>
  )
}
