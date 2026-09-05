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
  CommunityUnavailable,
  MissingDock,
  PageFallback,
  Privacy,
  SharedDock,
} from "./components/pages";
import { communityEnabled } from "./lib/availability";
import { examples } from "./lib/dock";
import { CatalogGate } from "./components/catalog-gate";
import { collectionById } from "./lib/collections";
const Composer = lazy(() =>
  import("./components/composer").then((module) => ({
    default: module.Composer,
  })),
);
const Contribute = lazy(() =>
  import("./components/contribute").then((module) => ({
    default: module.Contribute,
  })),
);
const Requests = lazy(() => import("./components/requests"));
const Review = lazy(() => import("./components/review"));
const Authentication = lazy(() =>
  import("./components/auth").then((module) => ({
    default: ({ signUp }: { signUp: boolean }) => (
      <module.AuthProvider>
        <module.SignInPage signUp={signUp} />
      </module.AuthProvider>
    ),
  })),
);
// Pages that need the community service. Without it they share one notice
// instead of loading forms and boards that can only fail.
const communityRoutes = new Set([
  "/requests",
  "/review",
  "/sign-in",
  "/sign-up",
]);
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
  // Lazy pages render their own heading while the chunk loads instead of
  // collapsing the destination into a generic placeholder.
  let fallback: ReactNode = <PageFallback />;
  try {
    // Old fragment links remain readable after the directory gains ordinary page URLs.
    if (hash.startsWith("#/dock/")) {
      route = "/dock";
      page = (
        <CatalogGate payload={hash.slice(7)}>
          {(dock) => <SharedDock dock={dock!} />}
        </CatalogGate>
      );
      title = "A shared Dock · DockFold";
    } else if (hash.startsWith("#/build/")) {
      route = "/create";
      page = (
        <CatalogGate payload={hash.slice(8)}>
          {(dock) => <Composer key={hash} initial={dock} />}
        </CatalogGate>
      );
      title = "Create your Dock · DockFold";
    } else if (/^#\/example\/[0-3]$/.test(hash)) {
      page = <SharedDock dock={examples[Number(hash.at(-1))].dock} example />;
    } else if (hash === "#/examples") {
      page = <Directory />;
      route = "/";
    } else if (path === "/dock" && hash.startsWith("#dock=")) {
      page = (
        <CatalogGate payload={hash.slice(6)}>
          {(dock) => <SharedDock dock={dock!} />}
        </CatalogGate>
      );
      title = "A shared Dock · DockFold";
    } else if (path === "/create" || path === "/submit") {
      // /submit remains an alias so existing "Make it yours" links keep working.
      route = "/create";
      page = (
        <CatalogGate
          payload={hash.startsWith("#dock=") ? hash.slice(6) : undefined}
          draft
        >
          {(dock) => (
            <Composer
              key={hash}
              initial={hash.startsWith("#dock=") ? dock : undefined}
            />
          )}
        </CatalogGate>
      );
      title = "Create your Dock · DockFold";
    } else if (path === "/review") {
      page = <Review />;
      title = "Review submissions · DockFold";
      fallback = (
        <PageFallback
          className="review-page"
          heading="Review submissions"
          copy="A private inbox for requests and icons. You decide what joins the collection."
        />
      );
    } else if (path === "/sign-in" || path === "/sign-up") {
      const signUp = path === "/sign-up";
      page = <Authentication signUp={signUp} />;
      title = "Sign in · DockFold";
      fallback = (
        <PageFallback
          className="auth-page"
          heading={signUp ? "Join with your email" : "Welcome back"}
          copy="One account, one vote per app. Your email stays private."
        />
      );
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
      fallback = (
        <PageFallback
          className="requests-page"
          heading="What belongs in the Dock next?"
          copy="Request an app. Vote for your favorites. Help the collection grow."
        />
      );
    } else if (path === "/contribute" || hash === "#/contribute") {
      route = "/contribute";
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
    if (!communityEnabled && communityRoutes.has(route)) {
      page = <CommunityUnavailable />;
      title = "Coming soon · DockFold";
    }
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
