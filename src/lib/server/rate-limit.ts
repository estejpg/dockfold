import 'server-only';
import { createHmac, randomBytes } from 'node:crypto';
import { readJSON, writeJSON, BlobPreconditionFailedError } from './storage';

type Bucket = { day: string; hour: string; salt: string; total: number; clients: Record<string, number> };
const path = 'control/v1/publish-rate.json';
export class PublishLimitError extends Error {}

// One bounded, private object; conditional writes are atomic across serverless instances.
// Beta caps: 120 new profiles/day across the service and 10/hour per network address.
export async function reservePublication(address: string) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const now = new Date().toISOString();
    const day = now.slice(0, 10), hour = now.slice(0, 13);
    const stored = await readJSON<Bucket>(path);
    const old = stored?.value;
    const bucket: Bucket = old?.day === day
      ? { ...old, clients: old.hour === hour ? { ...old.clients } : {}, hour }
      : { day, hour, salt: randomBytes(32).toString('hex'), total: 0, clients: {} };
    const client = createHmac('sha256', bucket.salt).update(address).digest('hex');
    if (bucket.total >= 120 || (bucket.clients[client] ?? 0) >= 10) throw new PublishLimitError('Sharing is busy. Please try again later.');
    bucket.total++;
    bucket.clients[client] = (bucket.clients[client] ?? 0) + 1;
    try { await writeJSON(path, bucket, stored?.etag); return; }
    catch (error) {
      if (error instanceof BlobPreconditionFailedError) continue;
      // Another instance may have created the very first bucket simultaneously.
      if (!stored && await readJSON(path)) continue;
      throw error;
    }
  }
  throw new PublishLimitError('Sharing is busy. Please try again shortly.');
}
