'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { triggerViewTransition, TransitionType } from './ViewTransitions'

interface TransitionLinkProps {
  href: string
  children: React.ReactNode
  transitionType?: TransitionType
  className?: string
  onClick?: () => void
  prefetch?: boolean
  [key: string]: any
}

export default function TransitionLink({
  href,
  children,
  transitionType = 'default',
  className,
  onClick,
  prefetch = true,
  ...props
}: TransitionLinkProps) {
  const router = useRouter()
  const linkRef = useRef<HTMLAnchorElement>(null)

  // Preload route on hover
  useEffect(() => {
    const link = linkRef.current
    if (!link || !prefetch) return

    const handleMouseEnter = () => {
      router.prefetch(href)
    }

    link.addEventListener('mouseenter', handleMouseEnter)
    return () => link.removeEventListener('mouseenter', handleMouseEnter)
  }, [href, router, prefetch])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow default behavior for new tab/window or background tab
    const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1
    if (isModified) {
      return
    }
    e.preventDefault()
    
    // Call custom onClick if provided
    if (onClick) {
      onClick()
    }

    // Use faster navigation for simple transitions
    if (transitionType === 'default') {
      router.push(href)
    } else {
      // Trigger view transition for complex animations
      triggerViewTransition(transitionType, () => {
        router.push(href)
      })
    }
  }

  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      onClick={handleClick}
      prefetch={prefetch}
      {...props}
    >
      {children}
    </Link>
  )
}

// Specialized transition link components for different page types
export function PokeballLink({ href, children, className, ...props }: Omit<TransitionLinkProps, 'transitionType'>) {
  return (
    <TransitionLink
      href={href}
      transitionType="pokeball"
      className={className}
      {...props}
    >
      {children}
    </TransitionLink>
  )
}

export function BattleLink({ href, children, className, ...props }: Omit<TransitionLinkProps, 'transitionType'>) {
  return (
    <TransitionLink
      href={href}
      transitionType="battle-flash"
      className={className}
      {...props}
    >
      {children}
    </TransitionLink>
  )
}

export function PokedexLink({ href, children, className, ...props }: Omit<TransitionLinkProps, 'transitionType'>) {
  return (
    <TransitionLink
      href={href}
      transitionType="pokedex-swipe"
      className={className}
      {...props}
    >
      {children}
    </TransitionLink>
  )
}

export function TileLink({ href, children, className, ...props }: Omit<TransitionLinkProps, 'transitionType'>) {
  return (
    <TransitionLink
      href={href}
      transitionType="tile-flip"
      className={className}
      {...props}
    >
      {children}
    </TransitionLink>
  )
}

export function TrainerCardLink({ href, children, className, ...props }: Omit<TransitionLinkProps, 'transitionType'>) {
  return (
    <TransitionLink
      href={href}
      transitionType="trainer-card"
      className={className}
      {...props}
    >
      {children}
    </TransitionLink>
  )
}

export function EnergyAuraLink({ href, children, className, ...props }: Omit<TransitionLinkProps, 'transitionType'>) {
  return (
    <TransitionLink
      href={href}
      transitionType="energy-aura"
      className={className}
      {...props}
    >
      {children}
    </TransitionLink>
  )
}
