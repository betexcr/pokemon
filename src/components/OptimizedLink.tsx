'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

interface OptimizedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  prefetch?: boolean
  priority?: boolean
  [key: string]: any
}

export default function OptimizedLink({
  href,
  children,
  className,
  onClick,
  prefetch = true,
  priority = false,
  ...props
}: OptimizedLinkProps) {
  const router = useRouter()
  const linkRef = useRef<HTMLAnchorElement>(null)
  const prefetchedRef = useRef(false)

  // Preload route on hover with debouncing
  useEffect(() => {
    const link = linkRef.current
    if (!link || !prefetch) return

    let hoverTimeout: NodeJS.Timeout

    const handleMouseEnter = () => {
      if (prefetchedRef.current) return
      
      // Debounce prefetch to avoid unnecessary requests
      hoverTimeout = setTimeout(() => {
        router.prefetch(href)
        prefetchedRef.current = true
      }, 150) // 150ms delay before prefetching
    }

    const handleMouseLeave = () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }

    link.addEventListener('mouseenter', handleMouseEnter)
    link.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      link.removeEventListener('mouseenter', handleMouseEnter)
      link.removeEventListener('mouseleave', handleMouseLeave)
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [href, router, prefetch])

  // Preload high-priority routes immediately
  useEffect(() => {
    if (priority && prefetch && !prefetchedRef.current) {
      router.prefetch(href)
      prefetchedRef.current = true
    }
  }, [href, router, prefetch, priority])

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

    // Use direct navigation for fastest response
    router.push(href)
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
