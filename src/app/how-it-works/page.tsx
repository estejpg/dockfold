import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
export const metadata = { title: 'How capture works' };
export default function HowItWorksPage() {
  return <main className="how-page"><header><Link href="/"><ArrowLeft size={16} /> DockFold</Link><span>How it works</span></header>
    <section className="how-hero"><h1>A little of your workflow.<br />Only what you choose.</h1><p>Your Dock says something about how you work. DockFold turns its pinned apps into an unlisted page you can share with a friend, a team, or anyone who asks.</p></section>
    <section className="how-steps">
      <article><span>01</span><h2>Capture</h2><p>Open DockFold on your Mac. It reads pinned apps, in order. Recent apps, files, folders, and Trash are ignored. Your Dock is never changed.</p></article>
      <article><span>02</span><h2>Make it yours</h2><p>Deselect anything you don’t want to share. Continue in your browser to add a name and a short note, or save a capture file to import later.</p></article>
      <article><span>03</span><h2>Share, or delete</h2><p>Create an unlisted link. Only then are your selected apps and profile details stored. Save the separate management link to delete the profile from any computer.</p></article>
    </section>
    <section className="how-compare"><h2>Unlisted means anyone with the link can view it.</h2><p>Shared Docks do not appear in the examples gallery, and we ask search engines not to index them. They are not password protected. App icons come from a small bundled catalog; unfamiliar apps show their initial. Local paths, icon files, and Dock settings are never uploaded.</p><p><Link className="text-button" href="/privacy">Read the privacy details</Link></p></section>
    <section className="how-cta"><h2>Start with the apps you keep close.</h2><a className="button button-dark" href="/downloads/DockFold.zip"><Download size={16} /> Download for Mac</a></section>
  </main>;
}
