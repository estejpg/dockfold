import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedProfile } from "@/components/shared-profile";
import { decodeProfile } from "@/lib/manifest";

function getProfile(payload: string) {
  try { return decodeProfile(payload); } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ payload: string }> }): Promise<Metadata> {
  const { payload } = await params;
  const profile = getProfile(payload);
  if (!profile) return { title: "Dock not found" };
  return { title: `${profile.name}'s Dock`, description: `${profile.name} keeps ${profile.apps.map((app) => app.name).join(", ")} close.` };
}

export default async function DockPage({ params }: { params: Promise<{ payload: string }> }) {
  const { payload } = await params;
  const profile = getProfile(payload);
  if (!profile) notFound();
  return <SharedProfile profile={profile} />;
}
