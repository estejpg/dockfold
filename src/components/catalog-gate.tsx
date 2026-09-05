import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { byId, decodeDock, readDraft, type Dock } from "../lib/dock";
import {
  catalogSnapshot,
  loadCatalog,
  settleCatalog,
  subscribeCatalog,
} from "../lib/live-catalog";
import { communityEnabled } from "../lib/availability";
import { MissingDock } from "./pages";
export function CatalogGate({
  payload,
  draft = false,
  children,
}: {
  payload?: string;
  draft?: boolean;
  children: (dock?: Dock) => ReactNode;
}) {
  const state = useSyncExternalStore(subscribeCatalog, catalogSnapshot);
  useEffect(() => {
    if (communityEnabled) void loadCatalog();
    else settleCatalog();
  }, []);
  try {
    const dock =
      payload !== undefined
        ? decodeDock(payload, false)
        : draft
          ? readDraft()
          : undefined;
    const missing = dock?.a.some((id) => !byId.has(id));
    if (missing)
      return (
        <main id="main" tabIndex={-1} className="reading-page">
          <h1>
            {state.status === "ready"
              ? "An app in this Dock is unavailable."
              : "Opening this Dock…"}
          </h1>
          <p role="status">
            {state.status === "error"
              ? "The app catalog couldn’t load. Your saved Dock hasn’t changed."
              : state.status === "ready"
                ? "Try refreshing the catalog. Your saved Dock hasn’t changed."
                : "Loading its approved app icons."}
          </p>
          {state.status === "error" || state.status === "ready" ? (
            <button className="button" onClick={() => void loadCatalog(true)}>
              Retry catalog
            </button>
          ) : null}
          <p>
            <a href="/">Explore Docks</a>
          </p>
        </main>
      );
    return children(dock);
  } catch {
    return <MissingDock />;
  }
}
