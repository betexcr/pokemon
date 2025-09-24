import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Usage Meta Demo',
  description: 'Demo of the Usage Meta module - requires real data connection',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://pokemon.ultharcr.com/usage-demo' },
  openGraph: {
    title: 'Usage Meta Demo',
    description: 'Demonstration of the usage module (disabled, real data only).',
    url: 'https://pokemon.ultharcr.com/usage-demo',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Usage Meta Demo',
    description: 'Demonstration of the usage module (disabled, real data only).'
  }
};

export default function UsageDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-fuchsia-500 to-rose-500 dark:from-blue-400 dark:via-fuchsia-400 dark:to-rose-400">
            Usage Meta Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Demonstration of the comprehensive competitive usage statistics system - Real data only
          </p>
        </header>

        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-800/30">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-200">Demo Disabled</h3>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            This demo page has been disabled to enforce real data only policy.
          </p>
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">
            Use the main usage features which connect to real competitive data sources.
          </p>
        </div>
      </div>
    </div>
  );
}