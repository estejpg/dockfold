"use client";

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Check, Copy, Download, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppIcon } from './app-icon';
import { DockStrip } from './dock-strip';
import { decodeManifest, manifestSchema, profileSchema } from '@/lib/manifest';
import type { Category, DockManifest } from '@/lib/types';
import { saveReceipt, receiptURL, type Receipt } from '@/lib/receipt';

const subscribe = (callback: () => void) => { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback); };
const snapshot = () => window.location.hash;
const serverSnapshot = () => '';
const randomHex = (bytes: number) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), n => n.toString(16).padStart(2, '0')).join('');

export function ProfileBuilder({ payload }: { payload?: string }) {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [imported, setImported] = useState<DockManifest | null>(null);
  const [error, setError] = useState('');
  const manifest = useMemo(() => {
    const source = new URLSearchParams(hash.slice(1)).get('dock') ?? payload;
    if (!source) return null;
    try { return decodeManifest(source); } catch { return null; }
  }, [hash, payload]);
  const current = imported ?? manifest;
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 36_000) throw new Error();
      setImported(manifestSchema.parse(JSON.parse(await file.text()))); setError('');
    } catch { setError('Choose a valid DockFold capture with 1–80 apps (up to 36 KB).'); }
  }
  if (current) return <BuilderForm key={JSON.stringify(current)} manifest={current} />;
  return <main className="builder-empty narrow-page">
    <Link className="back-link" href="/"><ArrowLeft size={16} /> Back to DockFold</Link>
    <h1>Bring your Dock along.</h1>
    <p>Open DockFold on your Mac, review the pinned apps, then choose Continue in browser.</p>
    <div className="share-actions"><a className="button button-dark" href="/downloads/DockFold.zip"><Download size={16} /> Download for Mac</a>
      <label className="button button-line"><Upload size={16} /> Import capture<input className="sr-only" type="file" accept=".json" onChange={event => void importFile(event.target.files?.[0])} /></label></div>
    <p className="form-privacy">macOS 14+ · Apple silicon and Intel. You can also import a capture saved from the app.</p>
    {hash || payload ? <p role="alert" className="form-error">This capture link is invalid. Try a fresh scan or import a saved capture.</p> : null}
    {error ? <p role="alert" className="form-error">{error}</p> : null}
  </main>;
}

function BuilderForm({ manifest }: { manifest: DockManifest }) {
  const [apps, setApps] = useState(manifest.apps);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>('Design');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const pending = useRef<Receipt | null>(null);
  const [copied, setCopied] = useState('');
  const parsed = profileSchema.safeParse({ v: 1, apps, name, role, note, category });

  async function publish() {
    if (!parsed.success || busy || receipt) return;
    setBusy(true); setError('');
    try {
      const attempt = pending.current ?? { id: randomHex(16), deletionKey: randomHex(32) };
      pending.current = attempt;
      // Save the key before the network request, so a lost response can be retried safely.
      saveReceipt(attempt);
      const response = await fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...attempt, profile: parsed.data }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not save your Dock. Please retry.');
      setReceipt(attempt);
      window.history.replaceState(null, '', '/share');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not connect. Please retry.'); }
    finally { setBusy(false); }
  }
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopied(label); }
    catch { setError('Clipboard access is unavailable. Select the link below or save your deletion key.'); }
  }
  function downloadReceipt() {
    if (!receipt) return;
    const content = `DockFold\n\nShared Dock: ${location.origin}/p/${receipt.id}\nManage or delete: ${receiptURL(receipt)}\n\nKeep the management link private. Anyone with it can delete your Dock.\n`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'DockFold-deletion-key.txt'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="builder-page">
    <header className="builder-header"><Link href="/"><ArrowLeft size={16} /> DockFold</Link><span>Review & share</span></header>
    <section className="builder-intro"><h1>{receipt ? 'Your Dock has a link.' : 'Make it yours.'}</h1><p>{receipt ? 'Share the public link. Keep the management link for yourself.' : 'Choose what to include and add a little context. Nothing is saved until you create a link.'}</p></section>
    <section className="builder-grid">
      <div className="review-panel"><div className="builder-panel-heading"><h2>Review apps</h2><span>{apps.length} included</span></div>
        <div className="review-list">{apps.map((app, index) => <div className="review-row" key={`${app.name}-${index}`}>
          <AppIcon app={app} size={40} /><div><strong>{app.name}</strong><span>{app.bundleIdentifier ?? 'App name only'}</span></div>
          <button type="button" disabled={busy || !!receipt} aria-label={`Remove ${app.name}`} onClick={() => setApps(current => current.filter((_, i) => i !== index))}><Trash2 size={16} /></button>
        </div>)}</div>
        {!receipt && apps.length !== manifest.apps.length ? <button type="button" className="text-button" onClick={() => setApps(manifest.apps)} disabled={busy}>Restore captured apps</button> : null}
      </div>
      <form className="profile-form" onSubmit={event => { event.preventDefault(); void publish(); }}>
        <div className="builder-panel-heading"><h2>{receipt ? 'Ready to share' : 'A little about your Dock'}</h2></div>
        {receipt ? <div className="receipt-panel">
          <label><span>Unlisted link</span><input readOnly value={`${location.origin}/p/${receipt.id}`} onFocus={event => event.target.select()} /></label>
          <div className="share-link-actions"><button className="button button-dark" type="button" onClick={() => void copy(`${location.origin}/p/${receipt.id}`, 'public')}>{copied === 'public' ? <Check size={16} /> : <Copy size={16} />} {copied === 'public' ? 'Copied' : 'Copy link'}</button><Link className="button button-line" href={`/p/${receipt.id}`}>View Dock <ArrowUpRight size={16} /></Link></div>
          <h3>Keep your deletion key.</h3><p>Save this before you leave. The management link lets you delete this Dock from any computer. Anyone with that link can delete it.</p>
          <div className="receipt-actions"><button className="button button-line" type="button" onClick={downloadReceipt}><Download size={16} /> Save deletion key</button><button className="text-button" type="button" onClick={() => void copy(receiptURL(receipt), 'manage')}>{copied === 'manage' ? 'Management link copied' : 'Copy management link'}</button><Link className="text-button" href={`/manage/${receipt.id}`}>Manage this Dock</Link></div>
        </div> : <>
          <fieldset disabled={busy}>
            <label><span>Name or title</span><input required value={name} onChange={event => setName(event.target.value)} maxLength={60} placeholder="Your name, or a name for this Dock" /></label>
            <label><span>Role</span><input required value={role} onChange={event => setRole(event.target.value)} maxLength={80} placeholder="Designer, developer, curious person…" /></label>
            <label><span>A short note</span><textarea required value={note} onChange={event => setNote(event.target.value)} maxLength={180} placeholder="What keeps these apps in your Dock?" /><small>{note.length}/180</small></label>
            <label><span>Discipline</span><select value={category} onChange={event => setCategory(event.target.value as Category)}><option>Design</option><option>Development</option><option>Writing</option><option>Music</option></select></label>
          </fieldset>
          <button className="button button-dark publish-button" type="submit" disabled={!parsed.success || busy}>{busy ? 'Creating your link…' : 'Create unlisted link'}<ArrowUpRight size={16} /></button>
          <p className="form-privacy">The selected app names, identifiers, and profile details will be stored on DockFold. Anyone with the link can view them. Your Dock stays out of the examples gallery. <Link href="/privacy">Privacy details</Link></p>
        </>}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <p className="sr-only" role="status">{copied ? 'Link copied to clipboard' : ''}</p>
      </form>
    </section>
    <section className="builder-dock-preview"><span>Your Dock</span><div className="dock-stage"><DockStrip apps={apps} /></div></section>
  </main>;
}
