import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  byId,
  catalog,
  DRAFT_KEY,
  shareURL,
  MAX_APPS,
  moveApp,
  readDraft,
  type Dock,
} from "../lib/dock";
import { AppIcon, DockStrip } from "./common";
import {
  catalogSnapshot,
  loadCatalog,
  subscribeCatalog,
} from "../lib/live-catalog";
import { communityEnabled } from "../lib/availability";
export function Composer({ initial }: { initial?: Dock }) {
  const catalogState = useSyncExternalStore(subscribeCatalog, catalogSnapshot);
  const filters = ["All apps", ...new Set(catalog.map((app) => app.category))];
  const [previousDraft] = useState(() => (initial ? readDraft() : null));
  const [canUndo, setCanUndo] = useState(Boolean(initial));
  const [dock, setDock] = useState<Dock>(() => initial ?? readDraft());
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All apps");
  const [saved, setSaved] = useState(true),
    [link, setLink] = useState(""),
    [notice, setNotice] = useState("");
  const linkRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dock));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [dock]);
  const visible = catalog.filter(
    (app) =>
      (filter === "All apps" || app.category === filter) &&
      app.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  function change(next: Dock) {
    setDock(next);
    setLink("");
    setNotice("");
  }
  function toggle(id: string) {
    const selected = dock.a.includes(id);
    if (!selected && dock.a.length >= MAX_APPS) {
      setNotice(`Choose up to ${MAX_APPS} apps.`);
      return;
    }
    change({
      ...dock,
      a: selected ? dock.a.filter((item) => item !== id) : [...dock.a, id],
    });
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Link copied.");
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setNotice("Copy the selected link with your keyboard or browser menu.");
    }
  }
  return (
    <main id="main" tabIndex={-1} className="submit-page">
      <section className="page-intro">
        <h1>Create your Dock</h1>
        <p>Build your own setup and share it with a friend.</p>
        <p className="fine-print">
          Your share link is unlisted. No account needed.
        </p>
        {canUndo &&
        previousDraft?.a.length &&
        previousDraft.a.every((id) => byId.has(id)) ? (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              change(previousDraft);
              setCanUndo(false);
            }}
          >
            Restore my previous draft
          </button>
        ) : null}
      </section>
      <div className="workspace">
        <section className="catalog-panel" aria-labelledby="catalog-title">
          <div className="section-heading">
            <h2 id="catalog-title">Choose your apps</h2>
            <span>{catalog.length} apps available</span>
          </div>
          {catalogState.status === "error" ? (
            <p className="fine-print">
              Showing bundled apps. Recent additions couldn’t load.{" "}
              <button
                className="text-button"
                onClick={() => void loadCatalog(true)}
              >
                Retry
              </button>
            </p>
          ) : null}
          <label className="search-control">
            <Search size={18} />
            <span className="sr-only">Search apps</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps"
              type="search"
            />
          </label>
          <div className="catalog-filter">
            <label htmlFor="catalog-category">Category</label>
            <select
              id="catalog-category"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {filters.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="app-grid" aria-label="Available apps">
            {visible.map((app) => (
              <button
                type="button"
                className="app-choice"
                aria-label={`${dock.a.includes(app.id) ? "Remove" : "Add"} ${app.name}`}
                aria-pressed={dock.a.includes(app.id)}
                key={app.id}
                onClick={() => toggle(app.id)}
              >
                <span className="choice-icon">
                  <AppIcon app={app} size={76} />
                  {dock.a.includes(app.id) ? (
                    <span className="selected-mark">
                      <Check size={13} />
                    </span>
                  ) : null}
                </span>
                <span>{app.name}</span>
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <div className="empty-results">
              <p>No apps match “{query}”.</p>
              <button
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setFilter("All apps");
                }}
              >
                Show all apps
              </button>
            </div>
          ) : null}
          <p className="catalog-foot">
            {communityEnabled ? (
              <>
                Missing an app?{" "}
                <a href="/requests">
                  Request it or vote for what comes next.{" "}
                  <ArrowUpRight size={16} />
                </a>
              </>
            ) : (
              "Missing an app? App requests are coming soon."
            )}
          </p>
        </section>
        <section className="dock-panel" aria-labelledby="dock-title">
          <div className="dock-panel-top">
            <div className="section-heading">
              <h2 id="dock-title">Your Dock</h2>
              <span aria-live="polite">
                {dock.a.length} {dock.a.length === 1 ? "app" : "apps"}
              </span>
            </div>
            <div className={`dock-preview ${dock.a.length ? "" : "is-empty"}`}>
              {dock.a.length ? (
                <DockStrip ids={dock.a} />
              ) : (
                <p>
                  Choose your first app.<span>Your Dock takes shape here.</span>
                </p>
              )}
            </div>
          </div>
          {dock.a.length ? (
            <ol
              className="selected-list"
              aria-label="Selected apps in Dock order"
            >
              {dock.a.map((id, index) => {
                const app = byId.get(id)!;
                return (
                  <li key={id}>
                    <span className="order-number">{index + 1}</span>
                    <AppIcon app={app} size={32} />
                    <span className="selected-name">{app.name}</span>
                    <div className="order-controls">
                      <button
                        type="button"
                        aria-label={`Move ${app.name} earlier`}
                        disabled={index === 0}
                        onClick={() =>
                          change({ ...dock, a: moveApp(dock.a, id, -1) })
                        }
                      >
                        <ArrowLeft size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${app.name} later`}
                        disabled={index === dock.a.length - 1}
                        onClick={() =>
                          change({ ...dock, a: moveApp(dock.a, id, 1) })
                        }
                      >
                        <ArrowRight size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${app.name} from Dock`}
                        onClick={() => toggle(id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}
          <form
            className="dock-details"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                setLink(
                  shareURL({ ...dock, n: dock.n.trim(), t: dock.t.trim() }),
                );
                setNotice("Your share link is ready.");
              } catch (error) {
                setNotice(
                  error instanceof Error
                    ? error.message
                    : "Could not create the link.",
                );
              }
            }}
          >
            <label htmlFor="dock-name">Give it a name</label>
            <input
              id="dock-name"
              value={dock.n}
              maxLength={60}
              required
              onChange={(e) => change({ ...dock, n: e.target.value })}
            />
            <label htmlFor="dock-note" className="sr-only">
              A little about your setup (optional)
            </label>
            <input
              id="dock-note"
              value={dock.t}
              maxLength={180}
              onChange={(e) => change({ ...dock, t: e.target.value })}
              placeholder="A little about your setup (optional)"
            />
            <button
              className="button button-dark create-link"
              disabled={!dock.a.length || !dock.n.trim()}
              type="submit"
            >
              Create share link
            </button>
            <p className="fine-print">
              {saved
                ? "Saved in this browser."
                : "Draft could not be saved in this browser."}{" "}
              Shared links can’t be revoked.
            </p>
            {link ? (
              <div className="share-result">
                <label htmlFor="share-link">Your share link</label>
                <input
                  ref={linkRef}
                  id="share-link"
                  value={link}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
                <div className="share-actions">
                  <button className="button" type="button" onClick={copy}>
                    <Copy size={15} />
                    Copy link
                  </button>
                  <a className="button" href={link}>
                    View Dock <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
            ) : null}
            <p className="status-message" role="status">
              {notice}
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
