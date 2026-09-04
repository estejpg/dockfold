"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { DockStrip } from "@/components/dock-strip";
import { decodeManifest, encodeDock } from "@/lib/manifest";
import type { Category, DockApp } from "@/lib/types";

export function ProfileBuilder({ payload }: { payload?: string }) {
  const manifest = useMemo(() => {
    if (!payload) return null;
    try { return decodeManifest(payload); } catch { return null; }
  }, [payload]);
  const [apps, setApps] = useState<DockApp[]>(() => manifest?.apps ?? []);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<Category>("Design");
  const [copied, setCopied] = useState(false);

  const profilePayload = useMemo(() => {
    if (!apps.length || !name.trim() || !role.trim() || !note.trim()) return null;
    return encodeDock({ v: 1, name: name.trim(), role: role.trim(), note: note.trim(), category, apps, publishedAt: new Date().toISOString().slice(0, 10) });
  }, [apps, category, name, note, role]);

  async function copyLink() {
    if (!profilePayload) return;
    const url = `${window.location.origin}/d/${profilePayload}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!manifest) {
    return (
      <main className="builder-empty">
        <p>Dock manifest</p>
        <h1>This capture link is missing or invalid.</h1>
        <p>Open Dockfold Capture on your Mac and scan the pinned apps in your Dock.</p>
        <Link className="button button-dark" href="/"><ArrowLeft size={16} /> Back to Discover</Link>
      </main>
    );
  }

  return (
    <main className="builder-page">
      <header className="builder-header">
        <Link href="/"><ArrowLeft size={16} /> Discover</Link>
        <span>2. Review <i /> 3. Share</span>
      </header>
      <section className="builder-intro">
        <p>{apps.length} pinned apps captured</p>
        <h1>Make it yours.</h1>
        <p>Remove anything you don’t want to share, add a little context, and copy your portable Dock link.</p>
      </section>
      <section className="builder-grid">
        <div className="review-panel">
          <div className="builder-panel-heading"><h2>Review apps</h2><span>{apps.length} included</span></div>
          <div className="review-list">
            {apps.map((app, index) => (
              <div className="review-row" key={`${app.bundleIdentifier ?? app.name}-${index}`}>
                <AppIcon app={app} size={40} />
                <div><strong>{app.name}</strong><span>{app.bundleIdentifier ?? "Bundle identifier unavailable"}</span></div>
                <button type="button" aria-label={`Remove ${app.name}`} onClick={() => setApps((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
        <form className="profile-form" onSubmit={(event) => event.preventDefault()}>
          <div className="builder-panel-heading"><h2>Profile details</h2><span>All fields required</span></div>
          <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Mina Park" /></label>
          <label><span>Role</span><input value={role} onChange={(event) => setRole(event.target.value)} maxLength={80} placeholder="Product designer" /></label>
          <label><span>Short note</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} placeholder="What keeps these apps in your Dock?" /><small>{note.length}/180</small></label>
          <label><span>Discipline</span><select value={category} onChange={(event) => setCategory(event.target.value as Category)}><option>Design</option><option>Development</option><option>Writing</option><option>Music</option></select></label>
          <div className="share-link-actions">
            <button className="button button-dark" type="button" disabled={!profilePayload} onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy share link"}</button>
            {profilePayload ? <Link className="button button-line" href={`/d/${profilePayload}`}>Preview <ArrowRight size={16} /></Link> : null}
          </div>
          <p className="form-privacy">The profile is encoded into the URL. Dockfold receives and stores no personal data.</p>
        </form>
      </section>
      <section className="builder-dock-preview"><span>Live preview</span><div className="dock-stage stage-night"><DockStrip apps={apps} /></div></section>
    </main>
  );
}
