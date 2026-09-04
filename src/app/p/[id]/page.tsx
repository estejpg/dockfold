import { notFound } from 'next/navigation';
import { readProfile } from '@/lib/server/profiles';
import { SharedProfile } from '@/components/shared-profile';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shared Dock', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await readProfile(id);
  if (!record) notFound();
  return <SharedProfile profile={record.value.profile} />;
}
