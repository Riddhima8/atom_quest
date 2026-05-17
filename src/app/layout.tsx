import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AtomQuest | Goal Setting & Tracking',
  description: 'A modern, premium portal for setting and tracking organizational goals.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
