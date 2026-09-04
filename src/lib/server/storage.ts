import 'server-only';
import { get, put, del, BlobPreconditionFailedError } from '@vercel/blob';

export function storageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
}

export async function readJSON<T>(path: string): Promise<{ value: T; etag: string } | null> {
  if (!storageConfigured()) throw new Error('Storage is not configured');
  // Bypass Blob's CDN as well as Next's caches so deletion takes effect immediately.
  const result = await get(path, { access: 'private', useCache: false });
  if (!result) return null;
  if (result.statusCode !== 200 || !result.stream) throw new Error('Storage returned no content');
  return { value: await new Response(result.stream).json() as T, etag: result.blob.etag };
}

export async function writeJSON(path: string, value: unknown, etag?: string) {
  return put(path, JSON.stringify(value), {
    access: 'private', addRandomSuffix: false, contentType: 'application/json',
    cacheControlMaxAge: 60, allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}),
  });
}

export { del as deleteBlob, BlobPreconditionFailedError };
