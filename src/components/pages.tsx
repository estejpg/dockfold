import { useState } from "react";
import { ArrowUpRight, Copy } from "lucide-react";
import { byId, shareURL, customizeURL, type Dock } from "../lib/dock";
import { SITE } from "../lib/site";
import { DockView } from "./dock-view";

export function SharedDock({ dock, example = false }: { dock: Dock; example?: boolean }) {
  const [notice, setNotice] = useState("");
  return (
    <main id="main" tabIndex={-1} className="dock-page shared-page">
      <header className="dock-head">
        <p className="eyebrow">{example ? "An example Dock" : "A shared Dock · unlisted"}</p>
        <h1>{dock.n}</h1>
        {dock.t ? <p className="shared-note">{dock.t}</p> : null}
      </header>
      <div className="stage stage-detail">
        <DockView apps={dock.a} size="lg" magnify />
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
        Shared through a link and not listed on {SITE.name}. Copies of this link can’t be revoked.
      </p>
    </main>
  );
}

export function About() {
  return (
    <main id="main" tabIndex={-1} className="reading-page">
      <h1>How the collection works</h1>
      <p>
        {SITE.name} is a directory of macOS Docks that we choose and arrange ourselves. Each one is a
        point of view: a handful of apps, in a deliberate order, with a sentence on why they belong
        together.
      </p>
      <h2>Curated, not crowdsourced</h2>
      <p>
        There are no accounts, votes or automatic listings. Suggestions are welcome, and we read
        every one, but a Dock only appears after we have reviewed it and arranged it in the same style
        as the rest. Credit goes to whoever sent the idea, if they want it.
      </p>
      <h2>Nothing to install, nothing scanned</h2>
      <p>
        The site never reads your Mac. There is no app, helper or browser extension. When you make a
        Dock your own, your choices stay in this browser, and a share link carries them in the part of
        the address after the #, which servers never see.
      </p>
      <h2>About the icons</h2>
      <p>
        App icons belong to their developers and are shown to identify each app. {SITE.name} is
        independent of them. If you make one of these apps and want its icon updated or removed, get in
        touch through <a href={SITE.authorUrl}>{SITE.author}</a>.
      </p>
      <div className="share-actions">
        <a className="button button-dark" href="/">
          Browse Docks
        </a>
        <a className="button" href="/submit">
          Suggest a Dock
        </a>
      </div>
    </main>
  );
}

export function Privacy() {
  return (
    <main id="main" tabIndex={-1} className="reading-page">
      <h1>A Dock, shared on your terms.</h1>
      <h2>The public collection</h2>
      <p>
        Home, Latest, Collections and Apps show Docks that {SITE.name} has published. Those pages list
        a name, a short description, a collection, the app icons in the Dock, and an optional credit.
        Suggesting a Dock does not publish it automatically.
      </p>
      <h2>Your draft stays in this browser</h2>
      <p>
        The optional Create page saves the apps you select, their order, the Dock name and its note in
        your browser’s local storage, along with your appearance and list-or-grid preference. It does
        not scan your computer or upload your Dock to a database. Clearing this site’s browser data
        removes them.
      </p>
      <h2>The link carries an unlisted Dock</h2>
      <p>
        A share link contains app identifiers, a name, and a note after the # symbol. This part is read
        by the browser and is not sent to the website’s hosting server in ordinary page requests.
        Anyone who receives the complete link can view and forward it. Link contents are encoded, not
        encrypted. There is no central record to delete, so a shared link cannot be revoked. Keep
        personal details out of the name and note.
      </p>
      <h2>Suggestions</h2>
      <p>
        The Suggest form sends a Dock name, description, collection, chosen app identifiers, and
        optional credit, email, and notes. {SITE.name} validates the fields and either emails the owner
        or opens your mail app with the same text. Notes and email stay off the public site. Submitted
        text is treated as data, never as HTML.
      </p>
      <p>
        No account is required. Contact {SITE.author} through <a href={SITE.authorUrl}>their website</a>{" "}
        to ask about a suggestion you sent.
      </p>
      <h2>Hosting</h2>
      <p>
        Vercel hosts the website and the optional suggestion endpoint, and may retain ordinary request
        logs, including network addresses. {SITE.name} adds no analytics or advertising scripts. Fonts
        and catalog icons are served with the site.
      </p>
      <p>
        <a href="https://vercel.com/legal/privacy-policy">Vercel privacy policy</a>
      </p>
    </main>
  );
}

export function RetiredCommunity() {
  return (
    <main id="main" tabIndex={-1} className="reading-page">
      <h1>This page has moved.</h1>
      <p>
        App requests, votes and icon uploads are no longer part of {SITE.name}. Browse the collection,
        or suggest a Dock.
      </p>
      <div className="share-actions">
        <a className="button button-dark" href="/">
          Browse Docks
        </a>
        <a className="button" href="/submit">
          Suggest a Dock
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
  return (
    <main id="main" tabIndex={-1} className={className}>
      {heading ? (
        <section className="page-intro">
          <h1>{heading}</h1>
          {copy ? <p>{copy}</p> : null}
        </section>
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
      <h1>This didn’t quite unfold.</h1>
      <p>
        The page may have moved, or a shared link may be incomplete or use an app that is no longer
        available. Try copying the full link again.
      </p>
      <a className="button button-dark" href="/">
        Browse Docks
      </a>
    </main>
  );
}
