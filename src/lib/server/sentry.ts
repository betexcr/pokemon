/**
 * Optional Sentry capture — no-op unless SENTRY_DSN (or NEXT_PUBLIC_SENTRY_DSN) is set.
 */
let initAttempted = false;
let sentryEnabled = false;

async function ensureSentry(): Promise<boolean> {
  if (initAttempted) return sentryEnabled;
  initAttempted = true;
  const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) {
    sentryEnabled = false;
    return false;
  }
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: true,
    });
    sentryEnabled = true;
  } catch {
    sentryEnabled = false;
  }
  return sentryEnabled;
}

export async function captureServerException(
  err: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  if (!(await ensureSentry())) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([k, v]) => {
          scope.setExtra(k, v);
        });
      }
      Sentry.captureException(err);
    });
  } catch {
    /* ignore */
  }
}
