"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { BrandMark } from "@/components/brand-mark";
import { DockStrip } from "@/components/dock-strip";
import { ShareDialog } from "@/components/share-dialog";
import { appCatalog, galleryProfiles, topApps } from "@/lib/apps";
import { encodeDock } from "@/lib/manifest";
import type { Category } from "@/lib/types";

const filters: Array<"All" | Category> = ["All", "Design", "Development", "Writing", "Music"];

export function Gallery() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredProfiles = useMemo(() => galleryProfiles.filter((profile) => {
    const matchesFilter = activeFilter === "All" || profile.category === activeFilter;
    const searchable = `${profile.name} ${profile.role} ${profile.note} ${profile.apps.map((app) => app.name).join(" ")}`.toLowerCase();
    return matchesFilter && (!deferredQuery || searchable.includes(deferredQuery));
  }), [activeFilter, deferredQuery]);

  return (
    <>
      <header className="site-header">
        <Link className="wordmark" href="/"><BrandMark />Dockfold</Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-active" href="/">Discover</Link>
          <a href="#top-apps">Top apps</a>
          <Link href="/how-it-works">How it works</Link>
        </nav>
        <button className="header-cta" type="button" onClick={() => setShareOpen(true)}>Share your Dock</button>
      </header>

      <main>
        <section className="intro-shell">
          <div className="intro-heading">
            <h1>The apps people<br />keep close.</h1>
            <p>Real Docks from designers, developers, and creators.</p>
          </div>
          <div className="intro-controls">
            <label className="search-control">
              <Search size={17} />
              <span className="sr-only">Search Docks</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or apps" />
            </label>
            <div className="filters" role="group" aria-label="Filter by discipline">
              {filters.map((filter) => (
                <button key={filter} type="button" className={filter === activeFilter ? "filter-active" : ""} onClick={() => setActiveFilter(filter)}>{filter}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="directory-shell">
          <div className="profile-list" aria-live="polite">
            <div className="list-heading"><span>{filteredProfiles.length} Docks</span><span>Latest first</span></div>
            {filteredProfiles.length ? filteredProfiles.map((profile) => (
              <article className="profile-row" key={profile.slug}>
                <div className="profile-copy">
                  <div>
                    <h2>{profile.name}</h2>
                    <p className="profile-role">{profile.role}</p>
                    <p className="profile-note">{profile.note}</p>
                  </div>
                  <Link href={`/d/${encodeDock(profile)}`}>Open Dock <span aria-hidden="true">↗</span></Link>
                </div>
                <div className={`dock-stage stage-${profile.backdrop}`}>
                  <DockStrip apps={profile.apps} />
                </div>
              </article>
            )) : (
              <div className="empty-state"><h2>No Docks found.</h2><p>Try another name, app, or discipline.</p></div>
            )}
          </div>

          <aside className="top-apps" id="top-apps">
            <div className="top-apps-heading"><h2>Most docked</h2><span>Community index</span></div>
            <ol>
              {topApps.map(([key, count], index) => {
                const app = appCatalog[key];
                return <li key={key}><span className="rank">{String(index + 1).padStart(2, "0")}</span><AppIcon app={app} size={32} /><span className="app-name">{app.name}</span><span className="app-count">{count.toLocaleString()}</span></li>;
              })}
            </ol>
          </aside>
        </section>

        <section className="method-strip">
          <p>One small Mac helper.</p>
          <h2>Your pinned apps become a portable link—reviewed by you, stored nowhere.</h2>
          <Link href="/how-it-works">See how capture works <span aria-hidden="true">↗</span></Link>
        </section>
      </main>

      <footer><span>Dockfold</span><span>Built in the open · Icons via macOSicons</span><span>2026</span></footer>
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
