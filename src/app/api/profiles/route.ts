import { NextRequest } from 'next/server';
import { z } from 'zod';
import { profileSchema } from '@/lib/manifest';
import { createProfile, ownsProfile, readProfile } from '@/lib/server/profiles';
import { reservePublication, PublishLimitError } from '@/lib/server/rate-limit';
import { BodyTooLarge, json, readBody, sameOrigin } from '@/lib/server/http';
import { storageConfigured } from '@/lib/server/storage';
export const runtime = 'nodejs';
export const maxDuration = 30;
const submission = z.object({ id: z.string().regex(/^[a-f0-9]{32}$/), deletionKey: z.string().regex(/^[a-f0-9]{64}$/), profile: profileSchema });

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Open DockFold in your browser to share.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Expected a JSON capture.' }, 415);
  if (!storageConfigured()) return json({ error: 'Sharing is temporarily unavailable. Your capture is still in this browser.' }, 503);
  let data;
  try { data = submission.parse(await readBody(request)); }
  catch (error) { return json({ error: error instanceof BodyTooLarge ? 'This capture is too large.' : 'Check your profile details and include 1–80 apps.' }, error instanceof BodyTooLarge ? 413 : 400); }
  try {
    const existing = await readProfile(data.id);
    if (existing) return ownsProfile(existing.value, data.deletionKey) ? json({ id: data.id }, 200) : json({ error: 'This link already exists. Start a new share.' }, 409);
    await reservePublication(process.env.VERCEL ? (request.headers.get('x-vercel-forwarded-for') ?? 'unknown') : 'local-development');
    await createProfile(data.id, data.deletionKey, { ...data.profile, publishedAt: new Date().toISOString() });
    return json({ id: data.id }, 201);
  } catch (error) {
    if (error instanceof PublishLimitError) return json({ error: error.message }, 429);
    // A concurrent retry may have completed the same request; keep publishing idempotent.
    try {
      const existing = await readProfile(data.id);
      if (existing && ownsProfile(existing.value, data.deletionKey)) return json({ id: data.id });
    } catch { /* report a generic failure without profile data or credentials */ }
    return json({ error: 'Could not save your Dock. Your details are still here; please retry.' }, 503);
  }
}
