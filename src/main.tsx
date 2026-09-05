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
import { Composer } from "./components/composer";
import {
  Contribute,
  Examples,
  MissingDock,
  Privacy,
  SharedDock,
} from "./components/pages";
import { decodeDock, examples } from "./lib/dock";
const Requests = lazy(() => import("./components/requests"));
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
function Application() {
  const route = useSyncExternalStore(
    subscribe,
    () => window.location.hash || "#/",
  );
  let page: ReactNode;
  let title = "DockFold — The apps you keep close";
  try {
    if (location.pathname !== "/" && location.pathname !== "/index.html")
      page = <MissingDock />;
    else if (route === "#/") page = <Composer />;
    else if (route.startsWith("#/build/"))
      page = <Composer key={route} initial={decodeDock(route.slice(8))} />;
    else if (route.startsWith("#/dock/")) {
      page = <SharedDock key={route} dock={decodeDock(route.slice(7))} />;
      title = "A shared Dock · DockFold";
    } else if (route === "#/examples") {
      page = <Examples />;
      title = "Example Docks · DockFold";
    } else if (/^#\/example\/[0-3]$/.test(route))
      page = (
        <SharedDock
          key={route}
          dock={examples[Number(route.at(-1))].dock}
          example
        />
      );
    else if (route === "#/requests") {
      page = (
        <Suspense
          fallback={
            <main id="main" className="reading-page">
              <p role="status">Loading app requests…</p>
            </main>
          }
        >
          <Requests />
        </Suspense>
      );
      title = "App requests · DockFold";
    } else if (route === "#/contribute") {
      page = <Contribute />;
      title = "Contribute an icon · DockFold";
    } else if (route === "#/privacy") {
      page = <Privacy />;
      title = "Privacy · DockFold";
    } else page = <MissingDock />;
  } catch {
    page = <MissingDock />;
  }
  useEffect(() => {
    document.title = title;
    window.scrollTo({ top: 0, behavior: "instant" });
    const frame = requestAnimationFrame(() => {
      const main = document.querySelector<HTMLElement>("main");
      main?.setAttribute("tabindex", "-1");
      const heading = main?.querySelector<HTMLElement>("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [route, title]);
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector<HTMLElement>("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <Header route={route} />
      {page}
      <Footer />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Application />);
