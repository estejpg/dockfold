import { notFound } from 'next/navigation';
import { ManageProfile } from '@/components/manage-profile';
export const metadata = { title: 'Manage your Dock', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default async function ManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{32}$/.test(id)) notFound();
  return <ManageProfile id={id} />;
}
