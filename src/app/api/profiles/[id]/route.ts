import { NextRequest } from 'next/server';
import { deleteProfile, ownsProfile, readProfile, validId, validToken } from '@/lib/server/profiles';
import { json, sameOrigin } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return json({ error: 'Open the management page to delete this Dock.' }, 403);
  const { id } = await params;
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!validId(id) || !validToken(token)) return json({ error: 'A valid deletion key is required.' }, 403);
  try {
    const record = await readProfile(id);
    if (!record) return json({ deleted: true });
    if (!ownsProfile(record.value, token)) return json({ error: 'This deletion key does not match the Dock.' }, 403);
    await deleteProfile(id);
    return json({ deleted: true });
  } catch { return json({ error: 'Could not delete this Dock. Please try again.' }, 503); }
}
