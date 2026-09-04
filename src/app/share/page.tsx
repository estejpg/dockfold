import { ProfileBuilder } from "@/components/profile-builder";

export default async function SharePage({ searchParams }: { searchParams: Promise<{ dock?: string }> }) {
  const { dock } = await searchParams;
  return <ProfileBuilder payload={dock} />;
}
