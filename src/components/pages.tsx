import { useState } from "react";
import { ArrowUpRight, Copy } from "lucide-react";
import { byId, shareURL, customizeURL, type Dock } from "../lib/dock";
import { DockStrip } from "./common";
export function SharedDock({
  dock,
  example = false,
}: {
  dock: Dock;
  example?: boolean;
}) {
  const [notice, setNotice] = useState("");
  return (
    <main id="main" tabIndex={-1} className="shared-page">
      <section className="page-intro">
        <p className="example-label">
          {example
            ? "An example Dock"
            : `${dock.a.length} apps, one little workflow`}
        </p>
        <h1>{dock.n}</h1>
        {dock.t ? <p className="shared-note">{dock.t}</p> : null}
      </section>
      <div className="shared-stage">
        <DockStrip ids={dock.a} />
      </div>
      <section className="shared-details">
        <div>
          <h2>In this Dock</h2>
          <p>{dock.a.map((id) => byId.get(id)!.name).join(", ")}</p>
        </div>
        <div className="share-actions">
          <button
            type="button"
            className="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareURL(dock));
                setNotice("Link copied.");
              } catch {
                setNotice("Copy this page’s address from your browser.");
              }
            }}
          >
            <Copy size={15} />
            Copy link
          </button>
          <a className="button button-dark" href={customizeURL(dock)}>
            Make it yours <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
      <p className="status-message shared-status" role="status">
        {notice}
      </p>
      <p className="fine-print shared-fine-print">
        Shared through a link, unlisted on DockFold. Copies of this link can’t
        be revoked.
      </p>
    </main>
  );
}
export function Privacy() {
  return (
    <main id="main" tabIndex={-1} className="reading-page">
      <h1>A Dock, shared on your terms.</h1>
      <h2>The public gallery</h2>
      <p>
        Home and Latest show Docks that DockFold has published. Those pages list
        a name, a short description, a category, the app icons in the Dock, and
        an optional credit. Suggesting a Dock does not publish it automatically.
      </p>
      <h2>Your draft stays in this browser</h2>
      <p>
        The optional Create page saves the apps you select, their order, the
        Dock name, and its note in your browser’s local storage. It does not
        scan your computer or upload your Dock to a database. Clearing this
        site’s browser data removes the local draft and appearance preference.
      </p>
      <h2>The link carries an unlisted Dock</h2>
      <p>
        A share link contains app identifiers, a name, and a note after the #
        symbol. This part is read by the browser and is not sent to the
        website’s hosting server in ordinary page requests. Anyone who receives
        the complete link can view and forward it. Link contents are encoded,
        not encrypted. There is no central record to delete, so a shared link
        cannot be revoked. Keep personal details out of the name and note.
      </p>
      <h2>Suggestions</h2>
      <p>
        The Submit form sends a Dock name, description, category, chosen app
        identifiers, and optional credit, email, and notes. DockFold validates
        the fields and either emails the owner or opens your mail app with the
        same text. Notes and email stay off the public gallery. Submitted text
        is treated as data, never as HTML.
      </p>
      <p>
        No account is required. Contact Esteban through his website to ask about
        a suggestion you sent.
      </p>
      <h2>Hosting</h2>
      <p>
        Vercel hosts the website and the optional suggestion endpoint, and may
        retain ordinary request logs, including network addresses. DockFold adds
        no analytics or advertising scripts. Fonts and catalog icons are served
        with the site.
      </p>
      <p>
        <a href="https://vercel.com/legal/privacy-policy">
          Vercel privacy policy
        </a>
      </p>
    </main>
  );
}
export function RetiredCommunity() {
  return (
    <main id="main" tabIndex={-1} className="reading-page">
      <h1>This page has moved.</h1>
      <p>
        App requests, votes and icon uploads are no longer part of DockFold.
        Browse the gallery, or suggest a Dock for the collection.
      </p>
      <div className="share-actions">
        <a className="button button-dark" href="/">
          Explore Docks
        </a>
        <a className="button" href="/submit">
          Submit a Dock
        </a>
      </div>
    </main>
  );
}
export function PageFallback({
  className = "reading-page",
  heading,
  copy,
}: {
  className?: string;
  heading?: string;
  copy?: string;
}) {
  const intro = heading ? (
    <>
      <h1>{heading}</h1>
      {copy ? <p>{copy}</p> : null}
    </>
  ) : null;
  return (
    <main id="main" tabIndex={-1} className={className}>
      {intro ? <section className="page-intro">{intro}</section> : null}
      <p role="status" className="loading-state">
        Loading…
      </p>
    </main>
  );
}
export function MissingDock() {
  return (
    <main id="main" tabIndex={-1} className="reading-page">
      <h1>This Dock didn’t quite unfold.</h1>
      <p>
        The link may be incomplete, use an unavailable app, or belong to the
        earlier capture prototype. Try copying the full link again.
      </p>
      <a className="button button-dark" href="/">
        Explore Docks
      </a>
    </main>
  );
}
