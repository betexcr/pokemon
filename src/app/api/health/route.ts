import { NextResponse } from 'next/server';
import { getRequestId, withRequestIdHeaders } from '@/lib/server/request-context';

/** Liveness probe — process is up. */
export async function GET(req: Request) {
  const requestId = getRequestId(req);
  return NextResponse.json(
    { ok: true, ts: new Date().toISOString() },
    { headers: withRequestIdHeaders(requestId) }
  );
}
