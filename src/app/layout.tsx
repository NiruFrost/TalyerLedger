import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'
import { OfflineBanner } from '@/components/shared/offline-banner'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
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
    <html lang="en" className={cn(geistMono.variable, inter.variable, 'font-sans')} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <Providers>
          <OfflineBanner />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
