import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { catalog } from "../lib/dock";
import {
  collections,
  formatDate,
  groups,
  latestCollections,
  matchesCollection,
  type Collection,
} from "../lib/collections";
import { DockStrip } from "./common";
function DockRow({ item }: { item: Collection }) {
  return (
    <a
      className="directory-row"
      href={`/docks/${item.id}`}
      aria-label={`${item.title} — ${item.apps.length} apps`}
    >
      <div className="row-title">
        <h3>{item.title}</h3>
        <ArrowUpRight size={14} />
      </div>
      <p>{item.description}</p>
      <DockStrip ids={item.apps} compact />
      <span className="row-meta">{item.apps.length} apps · View Dock</span>
    </a>
  );
}
export function Directory() {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("all");
  const deferred = useDeferredValue(query);
  const filtered = collections.filter(
    (item) =>
      (group === "all" || item.group === group) &&
      matchesCollection(item, deferred),
  );
  return (
    <main id="main" tabIndex={-1} className="directory-page">
      <section className="directory-intro">
        <div>
          <h1>A Dock for the way you work.</h1>
          <p>
            A curated collection of macOS Docks. Find a starting point, make it
            yours.
          </p>
        </div>
        <a className="button button-dark" href="/submit">
          Create your Dock <ArrowUpRight size={14} />
        </a>
      </section>
      <section className="directory-controls" aria-label="Find a Dock">
        <label className="search-control">
          <Search size={16} />
          <span className="sr-only">Search Docks or apps</span>
          <input
            type="search"
            placeholder="Search Docks or apps…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="category-links" role="group" aria-label="Filter Docks">
          <button
            type="button"
            onClick={() => setGroup("all")}
            aria-pressed={group === "all"}
          >
            All Docks
          </button>
          {groups.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setGroup(item.id)}
              aria-pressed={group === item.id}
            >
              {item.name
                .replace(" Docks", "")
                .replace("For the design desk", "Design")
                .replace("Read, write & research", "Research")}
            </button>
          ))}
        </div>
        <span className="collection-count" role="status">
          {filtered.length} Docks
        </span>
      </section>
      <div className="collection-columns">
        {groups.map((g) => {
          const items = filtered.filter((item) => item.group === g.id);
          return items.length ? (
            <section
              key={g.id}
              className="collection-group"
              aria-labelledby={`group-${g.id}`}
            >
              <div className="group-heading">
                <h2 id={`group-${g.id}`}>{g.name}</h2>
                <span>{items.length}</span>
              </div>
              <p className="group-description">{g.description}</p>
              {items.map((item) => (
                <DockRow item={item} key={item.id} />
              ))}
            </section>
          ) : null;
        })}
      </div>
      {filtered.length === 0 ? (
        <section className="empty-results">
          <h2>No Docks found.</h2>
          <p>Try another app or choose a different collection.</p>
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setGroup("all");
            }}
          >
            Clear search and filters
          </button>
        </section>
      ) : null}
      <section className="directory-bottom">
        <div>
          <h2>A small collection, made to grow.</h2>
          <p>
            {catalog.length} app icons. {collections.length} curated starting
            points. Your workflow is the interesting part.
          </p>
        </div>
        <a className="text-button" href="/submit">
          Suggest a Dock <ArrowRight size={15} />
        </a>
      </section>
    </main>
  );
}
export function Latest() {
  const items = latestCollections();
  const dates = [...new Set(items.map((item) => item.addedOn))];
  return (
    <main id="main" tabIndex={-1} className="latest-page">
      <section className="page-intro">
        <h1>Latest additions</h1>
        <p>The newest Docks in the collection, ready to make your own.</p>
      </section>
      {dates.map((date) => (
        <section
          className="latest-group"
          key={date}
          aria-labelledby={`date-${date}`}
        >
          <div className="latest-date">
            <h2 id={`date-${date}`}>
              <time dateTime={date}>{formatDate(date)}</time>
            </h2>
            <span>
              {items.filter((item) => item.addedOn === date).length} additions
            </span>
          </div>
          <ol>
            {items
              .filter((item) => item.addedOn === date)
              .map((item) => (
                <li key={item.id}>
                  <a href={`/docks/${item.id}`}>
                    <div className="latest-copy">
                      <div>
                        <h3>{item.title}</h3>
                        <span>
                          {groups.find((g) => g.id === item.group)?.name}
                        </span>
                      </div>
                      <p>{item.description}</p>
                    </div>
                    <DockStrip ids={item.apps} compact />
                    <ArrowUpRight size={15} />
                  </a>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
