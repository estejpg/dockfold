import { collectionName, formatDay, formatMonth, latestDocks } from "../lib/docks";
import { MiniDock } from "./dock-view";

export function Latest() {
  const months = new Map<string, ReturnType<typeof latestDocks>>();
  for (const dock of latestDocks()) {
    const key = dock.addedOn.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), dock]);
  }
  return (
    <main id="main" tabIndex={-1} className="narrow-page latest-page">
      <section className="page-intro">
        <h1>Latest additions</h1>
        <p>The newest Docks in the collection, newest first. Dates are when we published them.</p>
      </section>
      {[...months].map(([month, docks]) => (
        <section className="timeline" key={month} aria-labelledby={`month-${month}`}>
          <h2 className="group-heading" id={`month-${month}`}>
            {formatMonth(`${month}-01`)} <span className="mono">{docks.length}</span>
          </h2>
          <ol>
            {docks.map((dock) => (
              <li key={dock.id}>
                <a className="timeline-row" href={`/docks/${dock.id}`}>
                  <time className="row-date" dateTime={dock.addedOn}>
                    {formatDay(dock.addedOn)}
                  </time>
                  <span className="row-text">
                    <span className="row-title">{dock.title}</span>
                    <span className="row-summary">{dock.summary}</span>
                  </span>
                  <span className="row-collection">{collectionName(dock.collection)}</span>
                  <MiniDock apps={dock.apps} max={5} transitionName={`dock-${dock.id}`} />
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
