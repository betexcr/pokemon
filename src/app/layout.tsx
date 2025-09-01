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
    description: 'Explore the world of Pokémon with our modern, high-performance PokéDex application. Search, discover, and learn about your favorite Pokémon with beautiful UI and real-time data from PokeAPI.',
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com', // Replace with your actual domain
    siteName: 'PokéDex',
    images: [
      {
        url: '/pokedex.jpg',
        width: 1200,
        height: 630,
        alt: 'PokéDex - Modern Pokémon Database',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PokéDex - Modern Pokémon Database',
    description: 'Explore the world of Pokémon with our modern, high-performance PokéDex application. Search, discover, and learn about your favorite Pokémon with beautiful UI and real-time data from PokeAPI.',
    images: ['/pokedex.jpg'],
    creator: '@yourusername', // Replace with your Twitter handle
    site: '@yourusername', // Replace with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'facebook-domain-verification': 'your-verification-code', // Replace with your Facebook verification code
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
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        
        {/* Additional Social Media Meta Tags */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:alt" content="PokéDex - Modern Pokémon Database" />
        
        {/* LinkedIn specific */}
        <meta property="og:image:secure_url" content="/pokedex.jpg" />
        
        {/* Pinterest */}
        <meta name="pinterest-rich-pin" content="true" />
        
        {/* WhatsApp */}
        <meta property="og:image:url" content="/pokedex.jpg" />
        
        {/* Additional SEO */}
        <meta name="theme-color" content="#3B4CCA" />
        <meta name="msapplication-TileColor" content="#3B4CCA" />
        <meta name="application-name" content="PokéDex" />
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
