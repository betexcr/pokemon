/**
 * Privacy-friendly analytics module.
 *
 * In production, sends anonymized events to Vercel Analytics (via `/_vercel/insights`)
 * or Plausible/Umami if configured via env vars. In development, events are logged to the
 * console for debugging.
 *
 * No cookies, no fingerprinting, no PII collected.
 */

type EventName =
  | 'page_view'
  | 'pokemon_search'
  | 'battle_started'
  | 'battle_completed'
  | 'team_created'
  | 'team_saved'
  | 'checklist_milestone'
  | 'theme_changed'
  | 'locale_changed';

type EventProps = Record<string, string | number | boolean>;

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const analyticsEndpoint = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ANALYTICS_URL : undefined;

export function trackEvent(name: EventName, props?: EventProps): void {
  if (typeof window === 'undefined') return;

  if (isDev) {
    console.debug('[analytics]', name, props);
    return;
  }

  // Plausible / Umami-style beacon
  if (analyticsEndpoint) {
    const payload = {
      n: name,
      u: window.location.pathname,
      r: document.referrer,
      p: props,
    };
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(analyticsEndpoint, JSON.stringify(payload));
      } else {
        fetch(analyticsEndpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
    return;
  }

  // Vercel Analytics auto-collect (if the Vercel snippet is injected at edge)
  if (typeof (window as any).__vercel_analytics === 'function') {
    (window as any).__vercel_analytics('event', name, props);
  }
}

export function trackPageView(path?: string): void {
  const resolvedPath = path ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  trackEvent('page_view', { path: resolvedPath });
}
