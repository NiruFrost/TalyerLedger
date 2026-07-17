import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable, "font-sans", inter.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
