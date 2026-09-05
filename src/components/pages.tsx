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
      <h2>Your draft stays in this browser</h2>
      <p>
        DockFold saves the apps you select, their order, the Dock name, and its
        note in your browser’s local storage. It does not scan your computer or
        upload your Dock to a database. Clearing this site’s browser data
        removes the local draft and appearance preference.
      </p>
      <h2>The link carries the Dock</h2>
      <p>
        A share link contains app identifiers, a name, and a note after the #
        symbol. This part is read by the browser and is not sent to the
        website’s hosting server in ordinary page requests. Anyone who receives
        the complete link can view and forward it. Link contents are encoded,
        not encrypted.
      </p>
      <p>
        Shared Docks are unlisted. There is no central record to delete, so a
        shared link cannot be revoked or edited for everyone. Keep personal or
        sensitive details out of the name and note. Browser history, synced
        bookmarks, and services you paste the link into may retain it.
      </p>
      <h2>App requests and votes</h2>
      <p>
        Requests are sent to DockFold’s private review inbox. Esteban reviews
        them before publishing an app name and official website on the public
        leaderboard. Optional notes stay private. Creating or sharing a Dock
        does not submit it to a public directory.
      </p>
      <p>
        Email sign-in is provided by Clerk for voting and owner access. Clerk
        handles your email verification and session cookies. DockFold stores
        your account identifier and app votes in Neon Postgres; it does not
        publish your email or a list of voters. You can remove a vote using the
        same button while the request is open. Only accounts authorized on the
        server can access the review area.
      </p>
      <h2>Icon uploads go to a private inbox</h2>
      <p>
        The Contribute an icon form sends the PNG, app name, official website,
        icon source, and optional notes to DockFold’s private Vercel Blob
        storage. Files stay on your device until you select Submit icon.
        DockFold validates and re-encodes the PNG to remove embedded metadata.
        No account or email address is collected by this form.
      </p>
      <p>
        Esteban reviews submissions in the private area on DockFold. Approved
        app details and optimized icons become public when published. Original
        PNGs and notes remain private in Vercel Blob; review records are stored
        in Neon Postgres. Contributing an icon links it to an app request but
        does not automatically publish either one. No email or account is
        required to contribute. Keep personal information out of notes.
      </p>
      <p>
        Review records and originals are retained for moderation and provenance,
        including declined submissions. Contact Esteban through his website for
        removal of a submission or account-related data. Published files may
        remain in browser caches and copies others have saved.
      </p>
      <h2>Hosting</h2>
      <p>
        Vercel hosts the website, upload endpoint, and private icon storage, and
        may retain ordinary request logs, including network addresses. Upload
        rate limits help prevent abuse. Submission limits use a keyed digest of
        the network address. Expired limits are removed as new submissions
        arrive. DockFold adds no analytics or advertising scripts. Clerk loads
        on community and sign-in pages; fonts and bundled catalog icons are
        served with the site.
      </p>
      <p>
        <a href="https://clerk.com/legal/privacy">Clerk privacy policy</a> ·{" "}
        <a href="https://vercel.com/legal/privacy-policy">
          Vercel privacy policy
        </a>{" "}
        · <a href="https://neon.com/privacy-policy">Neon privacy policy</a>
      </p>
    </main>
  );
}
export function CommunityUnavailable() {
  return (
    <main id="main" tabIndex={-1} className="reading-page">
      <h1>Requests and contributions are coming soon.</h1>
      <p>
        DockFold is preparing its app request board, email voting and icon
        review. Until then, browse the curated Docks or create and share your
        own.
      </p>
      <div className="share-actions">
        <a className="button button-dark" href="/">
          Explore Docks
        </a>
        <a className="button" href="/create">
          Create your Dock
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
  // The sign-in page lays out its heading as direct flex children.
  const intro = heading ? (
    <>
      <h1>{heading}</h1>
      {copy ? <p>{copy}</p> : null}
    </>
  ) : null;
  return (
    <main id="main" tabIndex={-1} className={className}>
      {className === "auth-page" ? (
        intro
      ) : intro ? (
        <section className="page-intro">{intro}</section>
      ) : null}
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
