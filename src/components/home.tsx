import { ArrowRight, ChevronLeft, ChevronRight, LayoutGrid, List, Search, Shuffle } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  appsInDocks,
  collections,
  docksInCollection,
  featuredDocks,
  latestDocks,
  matchesDock,
  publishedDocks,
  sizeOf,
  sizes,
  type DockRecord,
  type SizeId,
} from "../lib/docks";
import { DockView } from "./dock-view";
import { DockCards, DockRows } from "./dock-list";

const VIEW_KEY = "dockfold:view";
type View = "list" | "grid";
const viewListeners = new Set<() => void>();
function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}
function useView() {
  const view = useSyncExternalStore(
    (callback) => {
      viewListeners.add(callback);
      return () => viewListeners.delete(callback);
    },
    readView,
    () => "list" as View,
  );
  const setView = (next: View) => {
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* the choice still applies until reload */
    }
    viewListeners.forEach((callback) => callback());
  };
  return [view, setView] as const;
}

function FeaturedStage({ docks }: { docks: DockRecord[] }) {
  const [index, setIndex] = useState(0);
  const dock = docks[index];
  if (!dock) return null;
  return (
    <section className="featured" aria-labelledby="featured-title">
      <div className="stage">
        <DockView key={dock.id} apps={dock.apps} layout={dock.layout} size="lg" magnify />
      </div>
      <div className="featured-caption">
        <div className="featured-copy" aria-live="polite">
          <p className="eyebrow">Featured</p>
          <h2 id="featured-title">
            <a href={`/docks/${dock.id}`}>{dock.title}</a>
          </h2>
          <p>{dock.summary}</p>
        </div>
        {docks.length > 1 ? (
          <div className="featured-switch" role="group" aria-label="Featured Docks">
            <button
              type="button"
              aria-label="Previous featured Dock"
              onClick={() => setIndex((index - 1 + docks.length) % docks.length)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="mono">
              {index + 1} / {docks.length}
            </span>
            <button
              type="button"
              aria-label="Next featured Dock"
              onClick={() => setIndex((index + 1) % docks.length)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function Home() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("all");
  const [size, setSize] = useState<"all" | SizeId>("all");
  const [view, setView] = useView();
  const deferred = useDeferredValue(query);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        search.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const matching = publishedDocks.filter((dock) => matchesDock(dock, deferred));
  const inCollection = (dock: DockRecord) => collection === "all" || dock.collection === collection;
  const ofSize = (dock: DockRecord) => size === "all" || sizeOf(dock) === size;
  const visible = matching.filter((dock) => inCollection(dock) && ofSize(dock));
  const sizeCounts = Object.fromEntries(
    sizes.map((item) => [item.id, matching.filter((dock) => inCollection(dock) && sizeOf(dock) === item.id).length]),
  );
  const collectionCounts = Object.fromEntries(
    collections.map((item) => [item.id, matching.filter((dock) => dock.collection === item.id && ofSize(dock)).length]),
  );
  const groups = collections
    .filter((item) => collection === "all" || item.id === collection)
    .map((item) => ({ ...item, docks: docksInCollection(item.id).filter((dock) => visible.includes(dock)) }))
    .filter((item) => item.docks.length);
  const surprise = latestDocks()[0];
  const clear = () => {
    setQuery("");
    setCollection("all");
    setSize("all");
  };

  const collectionButtons = (
    <>
      <button type="button" aria-pressed={collection === "all"} onClick={() => setCollection("all")}>
        All Docks <span>{matching.filter(ofSize).length}</span>
      </button>
      {collections.map((item) => (
        <button
          type="button"
          key={item.id}
          aria-pressed={collection === item.id}
          disabled={collectionCounts[item.id] === 0 && collection !== item.id}
          onClick={() => setCollection(collection === item.id ? "all" : item.id)}
          title={item.description}
        >
          {item.shortName} <span>{collectionCounts[item.id]}</span>
        </button>
      ))}
    </>
  );

  return (
    <main id="main" tabIndex={-1} className="home">
      <section className="intro">
        <p className="eyebrow">
          <span className="mono">{publishedDocks.length}</span> Docks ·{" "}
          <span className="mono">{appsInDocks().size}</span> apps
        </p>
        <h1>macOS Docks, curated by hand.</h1>
        <p>
          Every Dock here is chosen and arranged by us: which apps, in what order, and why they
          belong together. Nothing to install and nothing scanned. Know a good one?{" "}
          <a className="inline-link" href="/submit">
            Suggest it
          </a>
          .
        </p>
      </section>

      <FeaturedStage docks={featuredDocks()} />

      <section className="browse" aria-label="Browse Docks">
        <nav className="collection-rail" aria-label="Filter by collection">
          <p className="eyebrow">Collections</p>
          <div role="group" aria-label="Collections">
            {collectionButtons}
          </div>
        </nav>
        <div className="browse-main">
          <div className="controls">
            <label className="search-control">
              <Search size={15} />
              <span className="sr-only">Search Docks or apps</span>
              <input
                ref={search}
                type="search"
                placeholder="Search Docks or apps"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setQuery("");
                    event.currentTarget.blur();
                  }
                }}
              />
              <kbd aria-hidden="true">/</kbd>
            </label>
            <div className="view-toggle" role="group" aria-label="Layout">
              <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}>
                <List size={15} />
              </button>
              <button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
          <div className="segmented" role="group" aria-label="Dock size">
            <button type="button" aria-pressed={size === "all"} onClick={() => setSize("all")}>
              Any size
            </button>
            {sizes.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={size === item.id}
                disabled={sizeCounts[item.id] === 0 && size !== item.id}
                title={item.hint}
                onClick={() => setSize(size === item.id ? "all" : item.id)}
              >
                {item.label} <span className="mono">{sizeCounts[item.id]}</span>
              </button>
            ))}
          </div>
          <div className="collection-chips" role="group" aria-label="Collections">
            {collectionButtons}
          </div>
          <p className="result-count" role="status">
            {visible.length === publishedDocks.length
              ? `${visible.length} Docks`
              : `${visible.length} of ${publishedDocks.length} Docks`}
          </p>
          {groups.map((group) => (
            <section className="dock-group" key={group.id} aria-labelledby={`group-${group.id}`}>
              <h2 className="group-heading" id={`group-${group.id}`}>
                {group.name} <span className="mono">{group.docks.length}</span>
              </h2>
              {view === "grid" ? (
                <DockCards docks={group.docks} label={group.name} />
              ) : (
                <DockRows docks={group.docks} label={group.name} />
              )}
            </section>
          ))}
          {visible.length === 0 ? (
            <div className="empty-results">
              <h2>No Docks match.</h2>
              <p>Try another app name, or clear the filters.</p>
              <button type="button" className="text-button" onClick={clear}>
                Clear search and filters <ArrowRight size={14} />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {surprise ? (
        <a
          className="surprise"
          href={`/docks/${surprise.id}`}
          onClick={(event) => {
            event.preventDefault();
            const pick = publishedDocks[Math.floor(Math.random() * publishedDocks.length)];
            location.assign(`/docks/${pick.id}`);
          }}
        >
          <Shuffle size={14} /> Surprise me
        </a>
      ) : null}
    </main>
  );
}
