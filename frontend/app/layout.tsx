import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AppearanceProvider } from "@/components/appearance-provider"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Toaster } from "@/components/ui/toaster"
import { ScrollToTop, RouteScrollToTop } from "@/components/scroll-to-top"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Acero | Steel Building Manufacturer |Global | PEB | Engineering Services",
  description:
    "Acero designs, manufactures and supplies custom pre-engineered steel buildings, conventional steel buildings, racking systems, porta cabins and steel building accessories, from our UAE and India. Serving over 100 countries with a capacity of 150,000 MT/year.",
  generator: "v0.app",
  keywords: [
    "Acero",
    "steel building manufacturer",
    "PEB buildings",
    "conventional steel buildings",
    "warehousing racking",
    "porta cabins",
    "steel building",
    "steel structure building",
    "pre engineered buildings"
  ],
  authors: [{ name: "Acero Steel Manufacturing" }],
  icons: {
    icon: "/Logo/favicon.jpg",
    apple: "/Logo/favicon.jpg",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F7F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D0E" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider defaultTheme="light" storageKey="acero-theme">
          <AppearanceProvider>
          <RouteScrollToTop />
          <SmoothScroll>{children}</SmoothScroll>
          </AppearanceProvider>
        </ThemeProvider>
        <Toaster />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}
