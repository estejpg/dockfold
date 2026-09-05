import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  byId,
  catalog,
  DRAFT_KEY,
  encodeDock,
  MAX_APPS,
  moveApp,
  readDraft,
  type Dock,
} from "../lib/dock";
import { AppIcon, DockStrip } from "./common";
const filters = [
  "All",
  "Design",
  "Development",
  "Writing",
  "Music",
  "Browsers",
];
export function Composer({ initial }: { initial?: Dock }) {
  const [dock, setDock] = useState<Dock>(() => initial ?? readDraft());
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All");
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
  const visible = useMemo(
    () =>
      catalog.filter(
        (app) =>
          (filter === "All" || app.category === filter) &&
          app.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [filter, query],
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
    <main id="main">
      <section className="page-intro">
        <h1>The apps you keep close.</h1>
        <p>Pick your apps. Put them in order. Share your Dock.</p>
      </section>
      <div className="workspace">
        <section className="catalog-panel" aria-labelledby="catalog-title">
          <div className="section-heading">
            <h2 id="catalog-title">Choose your apps</h2>
            <span>{catalog.length} apps available</span>
          </div>
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
          <div className="filters" role="group" aria-label="Filter apps">
            {filters.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
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
                  setFilter("All");
                }}
              >
                Show all apps
              </button>
            </div>
          ) : null}
          <p className="catalog-foot">
            Missing an app?{" "}
            <a href="#/requests">
              Request it or vote for what comes next. <ArrowUpRight size={16} />
            </a>
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
              setLink(
                `${location.origin}${location.pathname}#/dock/${encodeDock({ ...dock, n: dock.n.trim(), t: dock.t.trim() })}`,
              );
              setNotice("Your share link is ready.");
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
