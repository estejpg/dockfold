"use client";

import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { DockStrip } from "@/components/dock-strip";
import type { DockProfile } from "@/lib/types";

export function SharedProfile({ profile }: { profile: DockProfile }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="shared-page">
      <header className="shared-header"><Link href="/">Dockfold</Link><button type="button" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy link"}</button></header>
      <section className="shared-hero">
        <div><p>{profile.category} · {profile.apps.length} apps</p><h1>{profile.name}</h1><h2>{profile.role}</h2><blockquote>“{profile.note}”</blockquote></div>
        <span className="shared-index">DF / {String(profile.apps.length).padStart(2, "0")}</span>
      </section>
      <section className="shared-dock"><div className="dock-stage stage-sky"><DockStrip apps={profile.apps} /></div></section>
      <section className="shared-list"><div><p>In this Dock</p><h2>{profile.apps.map((app) => app.name).join(", ")}</h2></div><Link href="/">Explore more Docks <span aria-hidden="true">↗</span></Link></section>
    </main>
  );
}
