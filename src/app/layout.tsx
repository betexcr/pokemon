import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://pokemon.ultharcr.com'),
  title: 'PokéDex - Modern Pokémon Database',
  description: 'Explore the world of Pokémon with our modern, high-performance PokéDex application. Search, discover, and learn about your favorite Pokémon with beautiful UI and real-time data from PokeAPI.',
  keywords: 'Pokémon, PokéDex, PokeAPI, gaming, database, search, discover',
  authors: [{ name: 'PokéDex Team' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'PokéDex - Modern Pokémon Database',
    description: 'Explore the world of Pokémon with our modern, high-performance PokéDex application. Search, discover, and learn about your favorite Pokémon with beautiful UI and real-time data from PokeAPI.',
    type: 'website',
    locale: 'en_US',
    url: 'https://pokemon.ultharcr.com',
    siteName: 'PokéDex',
    images: [
      {
        url: 'https://pokemon.ultharcr.com/pokedex.jpg',
        width: 1200,
        height: 630,
        alt: 'PokéDex - Modern Pokémon Database',
        type: 'image/jpeg',
        secureUrl: 'https://pokemon.ultharcr.com/pokedex.jpg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PokéDex - Modern Pokémon Database',
    description: 'Explore the world of Pokémon with our modern, high-performance PokéDex application. Search, discover, and learn about your favorite Pokémon with beautiful UI and real-time data from PokeAPI.',
    images: ['https://pokemon.ultharcr.com/pokedex.jpg'],
    creator: '@pokemondex',
    site: '@pokemondex',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://pokemon.ultharcr.com',
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
        
        
        {/* Viewport for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        
        {/* Additional SEO */}
        <meta name="theme-color" content="#3B4CCA" />
        <meta name="msapplication-TileColor" content="#3B4CCA" />
        <meta name="application-name" content="PokéDex" />
        <meta name="apple-mobile-web-app-title" content="PokéDex" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body suppressHydrationWarning className={`${inter.className} h-full bg-bg text-text pokeball-bg`}>
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-full">
              {children}
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
