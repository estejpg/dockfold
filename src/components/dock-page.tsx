import { ArrowLeft, ArrowRight, ArrowUpRight, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { byId, customizeURL } from "../lib/dock";
import {
  collectionName,
  formatDate,
  neighbours,
  relatedDocks,
  shareableDock,
  type DockRecord,
} from "../lib/docks";
import { SITE } from "../lib/site";
import { AppIcon } from "./common";
import { DockRows } from "./dock-list";
import { DockView } from "./dock-view";

export function DockPage({ dock }: { dock: DockRecord }) {
  const [notice, setNotice] = useState("");
  const { newer, older } = neighbours(dock);
  const related = relatedDocks(dock);
  const right = dock.layout.stacks.map((item) => (item.kind === "trash" ? "Trash" : item.label));

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const next = event.key === "ArrowLeft" ? newer : event.key === "ArrowRight" ? older : undefined;
      if (next) location.assign(`/docks/${next.id}`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newer, older]);

  return (
    <main id="main" tabIndex={-1} className="dock-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">All Docks</a>
        <span aria-hidden="true">/</span>
        <a href={`/collections/${dock.collection}`}>{collectionName(dock.collection)}</a>
      </nav>
      <header className="dock-head">
        <h1>{dock.title}</h1>
        <p>{dock.summary}</p>
        <p className="meta">
          <span className="mono">{dock.apps.length}</span> apps · Added{" "}
          <time dateTime={dock.addedOn}>{formatDate(dock.addedOn)}</time>
          {dock.updatedOn ? (
            <>
              {" "}
              · Updated <time dateTime={dock.updatedOn}>{formatDate(dock.updatedOn)}</time>
            </>
          ) : null}
        </p>
      </header>
      {dock.status === "retired" ? (
        <p className="notice" role="note">
          This Dock is retired. It stays here so old links keep working, but it is no longer listed.
        </p>
      ) : dock.status === "unlisted" ? (
        <p className="notice" role="note">
          This Dock is unlisted. Only people with the link can find it.
        </p>
      ) : null}
      <div className="stage stage-detail">
        <DockView
          apps={dock.apps}
          layout={dock.layout}
          size="lg"
          magnify
          transitionName={`dock-${dock.id}`}
        />
      </div>
      <div className="dock-body">
        <section aria-labelledby="why-title">
          <h2 id="why-title">Why it works</h2>
          <p className="note">{dock.note}</p>
          <p className="fine-print">
            {dock.credit ? (
              <>
                Thanks to{" "}
                {dock.creditUrl ? (
                  <a href={dock.creditUrl} rel="nofollow noopener noreferrer">
                    {dock.credit}
                  </a>
                ) : (
                  dock.credit
                )}{" "}
                · arranged by {SITE.name}
              </>
            ) : (
              <>Curated by {SITE.name}</>
            )}
          </p>
          <div className="share-actions">
            <a className="button button-dark" href={customizeURL(shareableDock(dock))}>
              Make it yours <ArrowUpRight size={14} />
            </a>
            <button
              type="button"
              className="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${location.origin}/docks/${dock.id}`);
                  setNotice("Link copied.");
                } catch {
                  setNotice("Copy this page’s address from your browser.");
                }
              }}
            >
              <Copy size={14} /> Copy link
            </button>
          </div>
          <p role="status" className="status-message">
            {notice}
          </p>
        </section>
        <section aria-labelledby="apps-title">
          <h2 id="apps-title">
            In this Dock <span className="mono">{dock.apps.length}</span>
          </h2>
          <ol className="app-order">
            {dock.apps.map((id, index) => {
              const app = byId.get(id)!;
              return (
                <li key={id}>
                  <span className="mono order">{index + 1}</span>
                  <AppIcon app={app} size={32} />
                  <a href={`/apps/${id}`}>{app.name}</a>
                  <span className="category">{app.category}</span>
                </li>
              );
            })}
          </ol>
          <p className="fine-print">Then, past the divider: {right.join(" and ")}.</p>
        </section>
      </div>
      {related.length ? (
        <section className="related" aria-labelledby="related-title">
          <h2 className="group-heading" id="related-title">
            More like this
          </h2>
          <DockRows docks={related} showCollection label="More like this" />
        </section>
      ) : null}
      <nav className="pager" aria-label="More Docks">
        {newer ? (
          <a href={`/docks/${newer.id}`} rel="prev" aria-keyshortcuts="ArrowLeft">
            <ArrowLeft size={14} />
            <span>
              <span className="pager-label">Newer</span>
              {newer.title}
            </span>
          </a>
        ) : (
          <span />
        )}
        {older ? (
          <a href={`/docks/${older.id}`} rel="next" className="pager-next" aria-keyshortcuts="ArrowRight">
            <span>
              <span className="pager-label">Older</span>
              {older.title}
            </span>
            <ArrowRight size={14} />
          </a>
        ) : null}
      </nav>
    </main>
  );
}
