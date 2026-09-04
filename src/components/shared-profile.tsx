"use client";

import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { DockStrip } from "@/components/dock-strip";
import type { DockProfile } from "@/lib/types";

export function SharedProfile({ profile, example = false }: { profile: DockProfile; example?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  async function copy() {
    try {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    } catch { setError("Clipboard unavailable. Copy this page’s address from your browser."); }
  }

  return (
    <main className="shared-page">
      <header className="shared-header"><Link href="/">DockFold</Link><button type="button" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy link"}</button></header>
      {error ? <p role="alert" className="copy-error">{error}</p> : null}
      <section className="shared-hero">
        <div>{example ? <p className="example-label">Illustrative example</p> : null}<p>{profile.category} · {profile.apps.length} apps</p><h1>{profile.name}</h1><h2>{profile.role}</h2><blockquote>“{profile.note}”</blockquote></div>
        <span className="shared-index">DF / {String(profile.apps.length).padStart(2, "0")}</span>
      </section>
      <section className="shared-dock"><div className="dock-stage stage-sky"><DockStrip apps={profile.apps} /></div></section>
      <section className="shared-list"><div><p>In this Dock</p><h2>{profile.apps.map((app) => app.name).join(", ")}</h2></div><Link href="/">Explore example Docks <span aria-hidden="true">↗</span></Link></section>
    </main>
  );
}
