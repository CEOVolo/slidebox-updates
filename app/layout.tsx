import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MetadataProvider } from '@/contexts/MetadataContext'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'SlideBox by Andersen - Knowledge Management Platform',
  description: 'Smart slide management system with Figma integration for IT companies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <MetadataProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {children}
          </div>
        </MetadataProvider>
      </body>
    </html>
  )
}
