import { NextResponse } from 'next/server';
import { getRequestId, withRequestIdHeaders } from '@/lib/server/request-context';
import { getRedis, pingRedis } from '@/lib/server/upstashRedis';

type ComponentStatus = 'ok' | 'missing' | 'error' | 'skipped';

function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/** Readiness — required prod deps available. */
export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const production = isProduction();

  const components: Record<string, ComponentStatus> = {};

  const hasUpstash =
    Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());

  if (!hasUpstash) {
    components.redis = production ? 'missing' : 'skipped';
  } else if (!getRedis()) {
    components.redis = 'error';
  } else {
    components.redis = (await pingRedis()) ? 'ok' : 'error';
  }

  const hasSa = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim());
  if (!hasSa) {
    components.firebaseAdmin = production ? 'missing' : 'skipped';
  } else {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
      components.firebaseAdmin = 'ok';
    } catch {
      components.firebaseAdmin = 'error';
    }
  }

  const failing = Object.values(components).some((s) => s === 'missing' || s === 'error');
  const ready = production ? !failing : true;
  const status = ready ? 200 : 503;

  return NextResponse.json(
    {
      ready,
      production,
      ts: new Date().toISOString(),
      components,
      ...(production
        ? {}
        : { note: 'Non-production: missing deps reported as skipped; HTTP 200 unless hard error' }),
    },
    { status, headers: withRequestIdHeaders(requestId) }
  );
}
