import { useState } from "react";
import { ArrowUpRight, Copy } from "lucide-react";
import { byId, shareURL, customizeURL, type Dock } from "../lib/dock";
import { REQUEST_URL } from "../lib/requests";
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
export function Contribute() {
  return (
    <main id="main" tabIndex={-1} className="reading-page">
      <h1>Bring an app to the collection.</h1>
      <p>
        Start with its name and website. A clear PNG of the icon helps us add it
        sooner.
      </p>
      <ol className="guide-steps">
        <li>
          <h2>Find the app</h2>
          <p>
            Open Finder → Applications. Select the app, then choose Get Info or
            press <kbd>⌘ I</kbd>.
          </p>
        </li>
        <li>
          <h2>Copy its icon</h2>
          <p>
            Click the small app icon at the top-left of the Get Info window.
            Press <kbd>⌘ C</kbd> to copy it.
          </p>
        </li>
        <li>
          <h2>Open it in Preview</h2>
          <p>
            Open Preview, then choose File → New from Clipboard or press{" "}
            <kbd>⌘ N</kbd>. If several sizes appear, select the largest image in
            the thumbnail sidebar.
          </p>
        </li>
        <li>
          <h2>Export a PNG</h2>
          <p>
            Choose File → Export (or right-click the selected thumbnail and
            choose Export As). Select PNG and keep transparency enabled. A
            square image at 512 × 512 pixels or larger works well.
          </p>
        </li>
        <li>
          <h2>Add it to the request</h2>
          <p>
            Open a new request—or an existing one for that app—and drag the PNG
            into the icon field or a comment. Include the app’s website and
            where the icon came from.
          </p>
        </li>
      </ol>
      <p className="fine-print">
        Icon export options can vary by macOS version and app. If export is
        unavailable, submit the app’s website without an icon.
      </p>
      <a
        className="button button-dark"
        href={REQUEST_URL}
        target="_blank"
        rel="noreferrer"
      >
        Request an app <ArrowUpRight size={16} />
      </a>
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
      <h2>Hosting</h2>
      <p>
        Vercel hosts the static website and may retain ordinary request logs.
        DockFold adds no analytics, tracking cookies, or advertising scripts.
        Fonts and catalog icons are served with the site.
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
