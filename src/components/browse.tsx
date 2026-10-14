import { byId, catalog } from "../lib/dock";
import { appsInDocks, collections, docksInCollection, docksWithApp, type DockRecord } from "../lib/docks";
import type { Collection } from "../lib/taxonomy";
import { AppIcon } from "./common";
import { DockRows } from "./dock-list";
import { MiniDock } from "./dock-view";

export function CollectionsIndex() {
  return (
    <main id="main" tabIndex={-1} className="narrow-page">
      <section className="page-intro">
        <h1>Collections</h1>
        <p>Shelves of Docks that share a purpose. Each Dock lives on exactly one.</p>
      </section>
      <ul className="collection-list">
        {collections.map((item) => {
          const docks = docksInCollection(item.id);
          return (
            <li key={item.id}>
              <a className="collection-row" href={`/collections/${item.id}`}>
                <span className="row-text">
                  <span className="row-title">{item.name}</span>
                  <span className="row-summary">{item.description}</span>
                </span>
                {docks[0] ? <MiniDock apps={docks[0].apps} max={5} /> : null}
                <span className="row-date">
                  <span className="mono">{docks.length}</span> Docks
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export function CollectionPage({ collection }: { collection: Collection }) {
  const docks = docksInCollection(collection.id);
  return (
    <main id="main" tabIndex={-1} className="narrow-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/collections">Collections</a>
      </nav>
      <section className="page-intro">
        <h1>{collection.name}</h1>
        <p>
          {collection.description} <span className="mono">{docks.length}</span> Docks, newest first.
        </p>
      </section>
      <DockRows docks={docks} label={collection.name} />
    </main>
  );
}

export function usedApps() {
  const counts = appsInDocks();
  return catalog
    .filter((app) => counts.has(app.id))
    .map((app) => ({ app, count: counts.get(app.id)! }))
    .sort((a, b) => b.count - a.count || a.app.name.localeCompare(b.app.name));
}

export function AppsIndex() {
  const apps = usedApps();
  return (
    <main id="main" tabIndex={-1} className="narrow-page wide">
      <section className="page-intro">
        <h1>Apps</h1>
        <p>
          The <span className="mono">{apps.length}</span> apps that appear in at least one Dock, most
          common first. Pick one to see every Dock it sits in.
        </p>
      </section>
      <ul className="app-tiles">
        {apps.map(({ app, count }) => (
          <li key={app.id}>
            <a href={`/apps/${app.id}`} className="app-tile">
              <AppIcon app={app} size={48} />
              <span className="tile-name">{app.name}</span>
              <span className="tile-count">
                <span className="mono">{count}</span> {count === 1 ? "Dock" : "Docks"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function AppPage({ appId }: { appId: string }) {
  const app = byId.get(appId)!;
  const docks: DockRecord[] = docksWithApp(appId);
  return (
    <main id="main" tabIndex={-1} className="narrow-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/apps">Apps</a>
      </nav>
      <section className="page-intro app-intro">
        <AppIcon app={app} size={64} />
        <div>
          <h1>{app.name}</h1>
          <p>
            {app.category}. In <span className="mono">{docks.length}</span>{" "}
            {docks.length === 1 ? "Dock" : "Docks"} in the collection.
          </p>
        </div>
      </section>
      <DockRows docks={docks} showCollection label={`Docks with ${app.name}`} />
    </main>
  );
}
