'use client'

import AppHeader from '@/components/AppHeader'
import { useSmartBackNavigation, useReferrerStorage } from '@/hooks/useSmartBackNavigation'
import type { NormalizedEvoGraph } from '@/lib/evo/types'

interface EvolutionsPageClientProps {
  title: string
  children: React.ReactNode
}

export default function EvolutionsPageClient({ title, children }: EvolutionsPageClientProps) {
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
