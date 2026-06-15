import type { Metadata } from "next";
import "./globals.css";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  title: "Smart POS",
  description: "Point of Sale System for Kenyan Shops",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
