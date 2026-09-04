"use client";

import Link from "next/link";
import { Search, Download, ArrowUpRight } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { BrandMark } from "@/components/brand-mark";
import { DockStrip } from "@/components/dock-strip";
import { ShareDialog } from "@/components/share-dialog";
import { appCatalog, galleryProfiles, topApps } from "@/lib/apps";
import { ThemeToggle } from "./theme-toggle";
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
        <Link className="wordmark" href="/"><BrandMark />DockFold</Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-active" href="/">Examples</Link>
          <Link href="/how-it-works">How it works</Link>
        </nav>
        <div className="header-actions"><ThemeToggle /><a className="button button-dark" href="/downloads/DockFold.zip" aria-label="Download for Mac"><Download size={16} /> Download for Mac</a></div>
      </header>

      <main>
        <section className="intro-shell">
          <div className="intro-heading">
            <h1>The apps you keep close.</h1>
            <p>Capture your Mac Dock. Share a little of how you work.</p>
            <div className="hero-actions"><button className="button button-dark" onClick={() => setShareOpen(true)}>Share your Dock</button><span>macOS 14+ · No account needed</span></div>
          </div>
          <div className="hero-dock"><DockStrip apps={[appCatalog.safari, appCatalog.figma, appCatalog.notion, appCatalog.terminal, appCatalog.spotify]} /></div>
        </section>
        <section className="examples-intro" id="examples"><h2>A few Docks to explore</h2><p>Illustrative examples. Your shared Docks stay unlisted.</p>
          <div className="intro-controls">
            <label className="search-control">
              <Search size={17} />
              <span className="sr-only">Search example Docks</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Docks or apps" />
            </label>
            <div className="filters" role="group" aria-label="Filter by discipline">
              {filters.map((filter) => (
                <button key={filter} type="button" aria-pressed={filter === activeFilter} className={filter === activeFilter ? "filter-active" : ""} onClick={() => setActiveFilter(filter)}>{filter}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="directory-shell">
          <div className="profile-list" aria-live="polite">
            <p className="sr-only">{filteredProfiles.length} examples</p>
            {filteredProfiles.length ? filteredProfiles.map((profile) => (
              <article className="profile-row" key={profile.slug}>
                <div className="profile-copy">
                  <div>
                    <h2>{profile.name}</h2>
                    <p className="profile-role">{profile.role}</p>
                    <p className="profile-note">{profile.note}</p>
                  </div>
                  <Link href={`/examples/${profile.slug}`}>Open example <ArrowUpRight size={14} /></Link>
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
            <div className="top-apps-heading"><h2>In these examples</h2></div>
            <ol>
              {topApps.map(([key, count], index) => {
                const app = appCatalog[key];
                return <li key={key}><span className="rank">{String(index + 1).padStart(2, "0")}</span><AppIcon app={app} size={32} /><span className="app-name">{app.name}</span><span className="app-count">{count.toLocaleString()}</span></li>;
              })}
            </ol><p className="sample-note">From 4 sample Docks</p>
          </aside>
        </section>

        <section className="method-strip">
<div><h2>A small window into your workflow.</h2><p>Review locally. Create an unlisted link. Delete it whenever you like.</p></div><Link href="/how-it-works">How it works <ArrowUpRight size={16} /></Link>
        </section>
      </main>

      <footer><span>DockFold</span><a href="https://www.estejpg.com/">Made by estejpg</a><span><a href="https://github.com/estejpg/dockfold">Source</a> · <Link href="/privacy">Privacy</Link></span></footer>
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
