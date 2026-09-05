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
      <h2>Collection submissions are public</h2>
      <p>
        Creating a share link does not add it to the collection. If you choose
        “Suggest for the collection,” GitHub opens a submission you can review
        before posting. Posted submissions and their Dock links are public.
        Esteban reviews them before adding a Dock to Home and Latest.
      </p>
      <h2>App requests are public</h2>
      <p>
        The App requests page loads public issues and vote counts directly from
        GitHub. GitHub receives that request, including your network address.
        The browser caches vote counts in session storage. Revisiting the board
        refreshes them after five minutes; the cache may remain until the tab
        closes. Requests, attached icons, comments, and reactions follow
        GitHub’s own privacy policy and account controls.
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
        Esteban and authorized project maintainers can review submissions in
        Vercel. Approved icons and app details may be published in the public
        catalog and GitHub repository; submission notes stay private. Uploads do
        not create public issues or votes. Pending files are retained until
        reviewed, and maintainers delete reviewed or rejected submissions from
        the inbox. Keep personal information out of the optional notes.
      </p>
      <h2>Hosting</h2>
      <p>
        Vercel hosts the website, upload endpoint, and private icon storage, and
        may retain ordinary request logs, including network addresses. Upload
        rate limits help prevent abuse. DockFold adds no analytics, tracking
        cookies, or advertising scripts. Fonts and catalog icons are served with
        the site.
      </p>
      <p>
        <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
          GitHub privacy policy
        </a>{" "}
        ·{" "}
        <a href="https://vercel.com/legal/privacy-policy">
          Vercel privacy policy
        </a>
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
