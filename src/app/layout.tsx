import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorProvider } from '@/contexts/ErrorContext'
import HelpAssistant from '@/components/HelpAssistant'
import ErrorTip from '@/components/ErrorTip'
import GlobalErrorCatcher from '@/components/GlobalErrorCatcher'
import RoutePreloader from '@/components/RoutePreloader'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import { ToastProvider } from '@/components/ToastProvider'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
import PWAInstaller from '@/components/PWAInstaller'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import OfflineIndicator from '@/components/OfflineIndicator'
import PokemonPreloader from '@/components/PokemonPreloader'


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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        
        
        {/* Viewport for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Early theme application to avoid flash of incorrect theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try {
  const doc = document.documentElement;
  const saved = localStorage.getItem('theme');
  const allowed = ['light','dark','gold','red','ruby'];
  let theme = (saved && allowed.includes(saved)) ? saved : null;
  if (!theme) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  doc.classList.remove('dark','theme-gold','theme-red','theme-ruby');
  if (theme === 'dark') doc.classList.add('dark');
  else if (theme === 'gold') doc.classList.add('theme-gold');
  else if (theme === 'red') doc.classList.add('theme-red');
  else if (theme === 'ruby') doc.classList.add('theme-ruby');
} catch(_) {} })();`
          }}
        />
        
        {/* Handle browser extensions that modify DOM (like Dark Reader) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { 
  // Suppress hydration warnings for browser extensions
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('Hydration failed') || 
         args[0].includes('hydration') ||
         args[0].includes('darkreader') ||
         args[0].includes('data-darkreader') ||
         args[0].includes('server rendered HTML') ||
         args[0].includes('client properties') ||
         args[0].includes('tree hydrated') ||
         args[0].includes('--darkreader-'))) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('Hydration') || 
         args[0].includes('darkreader') ||
         args[0].includes('data-darkreader') ||
         args[0].includes('--darkreader-'))) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };
})();`
          }}
        />
        
        {/* Dev-only: ensure no SW/caches interfere on localhost */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try {
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (isLocalhost) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister().catch(() => {}))).catch(() => {});
    }
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
    }
  }
} catch(_) {} })();`
          }}
        />

        {/* Additional SEO */}
        <meta name="theme-color" content="#3B4CCA" />
        <meta name="msapplication-TileColor" content="#3B4CCA" />
        <meta name="application-name" content="PokéDex" />
        <meta name="apple-mobile-web-app-title" content="PokéDex" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Structured Data: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'PokéDex',
              url: 'https://pokemon.ultharcr.com',
              logo: 'https://pokemon.ultharcr.com/pokedex.jpg',
              sameAs: [
                'https://twitter.com/pokemondex'
              ]
            })
          }}
        />

        {/* Structured Data: WebSite with potentialAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PokéDex',
              url: 'https://pokemon.ultharcr.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://pokemon.ultharcr.com/?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-bg text-text pokeball-bg site-gradient font-sans">
        <ErrorProvider>
          <AuthProvider>
            <ThemeProvider>
              <ReactQueryProvider>
                <ToastProvider>
                  <RoutePreloader />
                  <PerformanceMonitor />
                  <div className="min-h-screen">
                    <OfflineIndicator />
                    {children}
                    <GlobalErrorCatcher />
                    <HelpAssistant />
                    <ErrorTip />
                    <PWAInstaller />
                    <ServiceWorkerRegistration />
                    <PokemonPreloader />
                  </div>
                </ToastProvider>
              </ReactQueryProvider>
            </ThemeProvider>
          </AuthProvider>
        </ErrorProvider>
      </body>
    </html>
  )
}
