import 'server-only';
import type { NextRequest } from 'next/server';
export const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' };
export function json(value: unknown, status = 200) { return Response.json(value, { status, headers: privateHeaders }); }
export function sameOrigin(request: NextRequest) {
  const allowed = new Set([request.nextUrl.origin, process.env.SITE_URL, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`].filter(Boolean));
  const origin = request.headers.get('origin');
  return origin !== null && allowed.has(origin);
}
export class BodyTooLarge extends Error {}
export async function readBody(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 36_000) { await reader.cancel(); throw new BodyTooLarge(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
