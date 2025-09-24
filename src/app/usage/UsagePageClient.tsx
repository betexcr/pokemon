'use client'

import AppHeader from '@/components/AppHeader'
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
      {children}
    </>
  )
}
