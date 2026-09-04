import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata = { title: "How capture works" };

export default function HowItWorksPage() {
  return (
    <main className="how-page">
      <header><Link href="/"><ArrowLeft size={16} /> Discover</Link><span>Dockfold / Method</span></header>
      <section className="how-hero"><p>How capture works</p><h1>A share link,<br />not a user database.</h1><p>Dockfold turns the pinned-app portion of your macOS Dock preference into a small, readable manifest. You decide what leaves your Mac.</p></section>
      <section className="how-steps">
        <article><span>01</span><h2>Scan</h2><p>The Swift helper asks macOS for <code>com.apple.dock</code> and reads only <code>persistent-apps</code>. Recent apps, files, folders, and Trash are ignored.</p></article>
        <article><span>02</span><h2>Review</h2><p>Every detected app appears in a native list. Remove any item before continuing. The app sends no background telemetry.</p></article>
        <article><span>03</span><h2>Share</h2><p>Names and bundle identifiers are encoded into the URL. The website resolves known icons locally and renders the profile without storing it.</p></article>
      </section>
      <section className="how-compare"><div><p>Why this approach</p><h2>DockHunt proved the capture pattern. Dockfold makes the handoff inspectable and serverless.</h2></div><ul><li><span>DockHunt</span>Uploads unknown icon PNGs, authenticates, then creates a server record.</li><li><span>Dockfold</span>Reviews locally, creates a portable URL, and needs no identity provider or profile database.</li></ul></section>
      <section className="how-cta"><h2>Build the helper and make your first link.</h2><a className="button button-dark" href="https://github.com/estejpg/dockfold/tree/main/macos/DockfoldCapture" target="_blank" rel="noreferrer">View Mac source <ArrowRight size={16} /></a></section>
    </main>
  );
}
