import { randomUUID } from 'crypto';

export function getRequestId(req: { headers: Headers }): string {
  const incoming = req.headers.get('x-request-id')?.trim();
  if (incoming) return incoming.slice(0, 128);
  try {
    return randomUUID();
  } catch {
    return `req-${Date.now()}`;
  }
}

export function withRequestIdHeaders(requestId: string, init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set('x-request-id', requestId);
  return headers;
}
