import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PokéDex - Modern Pokémon Database',
  description: 'Explore the world of Pokémon with our modern, high-performance PokéDex application. Search, discover, and learn about your favorite Pokémon with beautiful UI and real-time data from PokeAPI.',
  keywords: 'Pokémon, PokéDex, PokeAPI, gaming, database, search, discover',
  authors: [{ name: 'PokéDex Team' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/favicon.ico', sizes: '180x180', type: 'image/x-icon' },
    ],
  },
  openGraph: {
    title: 'PokéDex - Modern Pokémon Database',
    description: 'Explore the world of Pokémon with our modern, high-performance PokéDex application.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PokéDex - Modern Pokémon Database',
    description: 'Explore the world of Pokémon with our modern, high-performance PokéDex application.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning className={`${inter.className} h-full bg-bg text-text`}>
        <ThemeProvider>
          <div className="min-h-full">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
