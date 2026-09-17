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
  MissingDock,
  PageFallback,
  Privacy,
  RetiredCommunity,
  SharedDock,
} from "./components/pages";
import { decodeDock, examples, readDraft } from "./lib/dock";
import { collectionById } from "./lib/collections";
const Composer = lazy(() =>
  import("./components/composer").then((module) => ({
    default: module.Composer,
  })),
);
const Suggest = lazy(() =>
  import("./components/suggest").then((module) => ({
    default: module.Suggest,
  })),
);
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
  let fallback: ReactNode = <PageFallback />;
  try {
    if (hash.startsWith("#/dock/")) {
      route = "/dock";
      page = <SharedDock dock={decodeDock(hash.slice(7))} />;
      title = "A shared Dock · DockFold";
    } else if (hash.startsWith("#/build/")) {
      route = "/create";
      page = <Composer key={hash} initial={decodeDock(hash.slice(8))} />;
      title = "Create your Dock · DockFold";
    } else if (/^#\/example\/[0-3]$/.test(hash)) {
      page = <SharedDock dock={examples[Number(hash.at(-1))].dock} example />;
    } else if (hash === "#/examples") {
      page = <Directory />;
      route = "/";
    } else if (path === "/dock" && hash.startsWith("#dock=")) {
      page = <SharedDock dock={decodeDock(hash.slice(6))} />;
      title = "A shared Dock · DockFold";
    } else if (path === "/create") {
      route = "/create";
      page = (
        <Composer
          key={hash}
          initial={
            hash.startsWith("#dock=") ? decodeDock(hash.slice(6)) : readDraft()
          }
        />
      );
      title = "Create your Dock · DockFold";
    } else if (
      path === "/submit" ||
      path === "/contribute" ||
      hash === "#/contribute"
    ) {
      route = "/submit";
      page = <Suggest />;
      title = "Submit a Dock · DockFold";
      fallback = (
        <PageFallback
          className="suggest-page"
          heading="Submit a Dock"
          copy="Suggest a setup for the gallery. Every submission gets a look."
        />
      );
    } else if (
      path === "/requests" ||
      path === "/review" ||
      path === "/sign-in" ||
      path === "/sign-up" ||
      hash === "#/requests"
    ) {
      page = <RetiredCommunity />;
      title = "Moved · DockFold";
    } else if (path === "/latest") {
      page = <Latest />;
      title = "Latest additions · DockFold";
    } else if (path.startsWith("/docks/")) {
      const item = collectionById.get(path.slice(7));
      page = item ? <CollectionDetail item={item} /> : <MissingDock />;
      title = item ? `${item.title} · DockFold` : "Dock not found · DockFold";
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
      <Suspense fallback={fallback}>{page}</Suspense>
      <Footer />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Application />);
