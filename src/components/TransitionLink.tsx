'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { triggerViewTransition, TransitionType } from './ViewTransitions'

interface TransitionLinkProps {
  href: string
  children: React.ReactNode
  transitionType?: TransitionType
  className?: string
  onClick?: () => void
  [key: string]: any
}

export default function TransitionLink({
  href,
  children,
  transitionType = 'default',
  className,
  onClick,
  ...props
}: TransitionLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    // Call custom onClick if provided
    if (onClick) {
      onClick()
    }

    // Trigger view transition
    triggerViewTransition(transitionType, () => {
      router.push(href)
    })
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
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
