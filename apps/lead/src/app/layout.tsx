import { Inter as FontSans } from 'next/font/google'

import type { Metadata } from 'next'

import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/provider/theme-provider'

import { Toaster } from '@midday/ui/toaster'
import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})
export const metadata: Metadata = {
  title: 'Solomon AI | Lead',
  description: 'Grow Your business with AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-black text-white font-sans antialiased',
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
