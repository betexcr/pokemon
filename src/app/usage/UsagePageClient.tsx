'use client'

import AppHeader from '@/components/AppHeader'
import OfflineBanner from '@/components/OfflineBanner'
import { useSmartBackNavigation, useReferrerStorage } from '@/hooks/useSmartBackNavigation'

interface UsagePageClientProps {
  title: string
  children: React.ReactNode
}

export default function UsagePageClient({ title, children }: UsagePageClientProps) {
  // Store current page as referrer for smart back navigation
  useReferrerStorage()
  
  // Use smart back navigation
  const { backLink, backLabel } = useSmartBackNavigation({
    defaultBackLink: '/insights',
    defaultBackLabel: 'Back to Insights'
  })

  return (
    <>
      <AppHeader 
        title={title} 
        backLink={backLink} 
        backLabel={backLabel} 
        showToolbar={true} 
      />
      <div className="mx-auto max-w-7xl px-4 pt-2">
        <OfflineBanner requiresNetwork blockedMessage="Usage stats require an internet connection. Data from Smogon and other sources is not available offline." />
      </div>
      {children}
    </>
  )
}
