import {
  lazy,
  Suspense,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "./styles.css";
import { Header, Footer } from "./components/common";
import { Directory, Latest } from "./components/directory";
import { CollectionDetail } from "./components/collection-detail";
import {
  Contribute,
  MissingDock,
  Privacy,
  SharedDock,
} from "./components/pages";
import { decodeDock, examples } from "./lib/dock";
import { collectionById } from "./lib/collections";
const Composer = lazy(() =>
  import("./components/composer").then((m) => ({ default: m.Composer })),
);
const Requests = lazy(() => import("./components/requests"));
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
function Application() {
  const hash = useSyncExternalStore(subscribe, () => location.hash);
  const path = location.pathname.replace(/\/$/, "") || "/";
  let route = path;
  let page: ReactNode;
  let title = "DockFold — A curated collection of macOS Docks";
  try {
    // Old fragment links remain readable after the directory gains ordinary page URLs.
    if (hash.startsWith("#/dock/")) {
      route = "/dock";
      page = <SharedDock dock={decodeDock(hash.slice(7))} />;
      title = "A shared Dock · DockFold";
    } else if (hash.startsWith("#/build/")) {
      route = "/submit";
      page = <Composer key={hash} initial={decodeDock(hash.slice(8))} />;
      title = "Submit a Dock · DockFold";
    } else if (/^#\/example\/[0-3]$/.test(hash)) {
      page = <SharedDock dock={examples[Number(hash.at(-1))].dock} example />;
    } else if (hash === "#/examples") {
      page = <Directory />;
      route = "/";
    } else if (path === "/dock" && hash.startsWith("#dock=")) {
      page = <SharedDock dock={decodeDock(hash.slice(6))} />;
      title = "A shared Dock · DockFold";
    } else if (path === "/submit") {
      page = (
        <Composer
          key={hash}
          initial={
            hash.startsWith("#dock=") ? decodeDock(hash.slice(6)) : undefined
          }
        />
      );
      title = "Submit a Dock · DockFold";
    } else if (path === "/latest") {
      page = <Latest />;
      title = "Latest additions · DockFold";
    } else if (path.startsWith("/docks/")) {
      const item = collectionById.get(path.slice(7));
      page = item ? <CollectionDetail item={item} /> : <MissingDock />;
      title = item ? `${item.title} · DockFold` : "Dock not found · DockFold";
    } else if (path === "/requests" || hash === "#/requests") {
      route = "/requests";
      page = <Requests />;
      title = "App requests · DockFold";
    } else if (path === "/contribute" || hash === "#/contribute") {
      page = <Contribute />;
      title = "Contribute an icon · DockFold";
    } else if (path === "/privacy" || hash === "#/privacy") {
      page = <Privacy />;
      title = "Privacy · DockFold";
    } else if (
      (path === "/" || path === "/index.html") &&
      (!hash || hash === "#/")
    ) {
      page = <Directory />;
      route = "/";
    } else page = <MissingDock />;
  } catch {
    page = <MissingDock />;
    title = "Dock not found · DockFold";
  }
  useEffect(() => {
    document.title = title;
  }, [title]);
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector<HTMLElement>("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <Header route={route} />
      <Suspense
        fallback={
          <main id="main" tabIndex={-1} className="reading-page">
            <p role="status">Loading…</p>
          </main>
        }
      >
        {page}
      </Suspense>
      <Footer />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Application />);
