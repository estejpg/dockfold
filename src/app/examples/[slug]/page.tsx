import { notFound } from 'next/navigation';
import { galleryProfiles } from '@/lib/apps';
import { SharedProfile } from '@/components/shared-profile';
export const metadata = { title: 'Example Dock' };
export default async function ExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = galleryProfiles.find(item => item.slug === slug);
  if (!profile) notFound();
  return <SharedProfile profile={profile} example />;
}
