import { FAN_SITE_DISCLAIMER } from '@/lib/site/siteUrl'

/**
 * Fan-site disclaimer footer. The root layout renders one after normal-flow pages. Pages that
 * scroll inside their own container (`fixed inset-0` / full-height roots) mark their root with
 * `data-own-footer` and render this at the end of that container instead; the layout's copy is
 * then hidden (see `.layout-footer` in globals.css), so it never floats behind or outside them.
 */
export function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`px-4 pb-6 pt-10 text-center text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <p className="mx-auto max-w-3xl">{FAN_SITE_DISCLAIMER}</p>
    </footer>
  )
}
