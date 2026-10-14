import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "./styles.css";
import { App, resolveRoute } from "./app";

const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};

function ClientApp({ initialHash }: { initialHash: string }) {
  const hash = useSyncExternalStore(
    subscribe,
    () => location.hash,
    () => initialHash,
  );
  const match = useMemo(() => resolveRoute(location.pathname, hash), [hash]);
  useEffect(() => {
    document.title = match.title;
  }, [match.title]);
  return <App match={match} />;
}

const container = document.getElementById("root")!;
const initialHash = location.hash;
const first = resolveRoute(location.pathname, initialHash);
if (container.dataset.route && container.dataset.route === first.key) {
  hydrateRoot(container, <ClientApp initialHash={initialHash} />);
} else {
  container.replaceChildren();
  createRoot(container).render(<ClientApp initialHash={initialHash} />);
}
