import { lazy, Suspense, type ReactNode } from "react";
import { Footer, Header } from "./components/common";
import { Directory, Latest } from "./components/directory";
import { CollectionDetail } from "./components/collection-detail";
import {
  MissingDock,
  PageFallback,
  Privacy,
  RetiredCommunity,
  SharedDock,
} from "./components/pages";
import { decodeDock, examples } from "./lib/dock";
import { allDocks, findDock, latestDocks, publishedDocks } from "./lib/docks";
import { pageTitle, SITE } from "./lib/site";

const Composer = lazy(() =>
  import("./components/composer").then((module) => ({ default: module.Composer })),
);
const Suggest = lazy(() =>
  import("./components/suggest").then((module) => ({ default: module.Suggest })),
);

export type RouteMatch = {
  // Prerendered pages carry this key; the browser hydrates only when it matches.
  key: string;
  nav: string;
  title: string;
  description: string;
  canonical?: string;
  status: 200 | 404;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
  element: ReactNode;
  fallback?: ReactNode;
};

const CLIENT = "client";
const retiredPaths = new Set(["/requests", "/review", "/sign-in", "/sign-up"]);

export function normalizePath(path: string) {
  return path.replace(/\/+$/, "") || "/";
}

function notFound(): RouteMatch {
  return {
    key: "404",
    nav: "",
    title: pageTitle("Page not found"),
    description: "This page is not part of the collection.",
    status: 404,
    noindex: true,
    element: <MissingDock />,
  };
}

function home(key: string): RouteMatch {
  return {
    key,
    nav: "/",
    title: pageTitle(),
    description: SITE.description,
    canonical: "/",
    status: 200,
    element: <Directory />,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: publishedDocks.length,
        itemListElement: latestDocks().map((dock, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE.url}/docks/${dock.id}`,
          name: dock.title,
        })),
      },
    },
  };
}

function clientOnly(nav: string, title: string, element: ReactNode, fallback?: ReactNode): RouteMatch {
  return {
    key: CLIENT,
    nav,
    title: pageTitle(title),
    description: SITE.description,
    status: 200,
    noindex: true,
    element,
    fallback,
  };
}

function hashRoute(hash: string): RouteMatch | undefined {
  try {
    if (hash.startsWith("#/dock/"))
      return clientOnly("", "A shared Dock", <SharedDock dock={decodeDock(hash.slice(7))} />);
    if (hash.startsWith("#/build/"))
      return clientOnly("/create", "Create your Dock", <Composer key={hash} initial={decodeDock(hash.slice(8))} />);
    if (/^#\/example\/[0-3]$/.test(hash))
      return clientOnly("", "An example Dock", <SharedDock dock={examples[Number(hash.at(-1))].dock} example />);
  } catch {
    return { ...notFound(), key: CLIENT, status: 200 };
  }
  if (hash === "#/contribute") return clientOnly("/submit", "Submit a Dock", <Suggest />);
  if (hash === "#/requests") return clientOnly("", "Moved", <RetiredCommunity />);
  if (hash === "#/privacy") return clientOnly("", "Privacy", <Privacy />);
  return undefined;
}

export function resolveRoute(rawPath: string, hash = ""): RouteMatch {
  const path = normalizePath(rawPath);
  if (path === "/" || path === "/index.html") {
    if (!hash || hash === "#/" || hash === "#/examples") return home("/");
    return hashRoute(hash) ?? home("/");
  }
  if (path === "/dock") {
    if (hash.startsWith("#dock=")) {
      try {
        return clientOnly("", "A shared Dock", <SharedDock dock={decodeDock(hash.slice(6))} />);
      } catch {
        return { ...notFound(), key: CLIENT, status: 200 };
      }
    }
    return clientOnly("", "A shared Dock", <MissingDock />, <PageFallback />);
  }
  if (path === "/create") {
    let initial;
    try {
      initial = hash.startsWith("#dock=") ? decodeDock(hash.slice(6)) : undefined;
    } catch {
      return { ...notFound(), key: CLIENT, status: 200 };
    }
    return clientOnly("/create", "Create your Dock", <Composer key={hash} initial={initial} />);
  }
  if (path === "/latest")
    return {
      key: path,
      nav: "/latest",
      title: pageTitle("Latest additions"),
      description: "The newest Docks in the collection, newest first.",
      canonical: path,
      status: 200,
      element: <Latest />,
    };
  if (path === "/submit")
    return {
      key: path,
      nav: "/submit",
      title: pageTitle("Suggest a Dock"),
      description: "Suggest a macOS Dock for the collection. No account needed; every suggestion is reviewed.",
      canonical: path,
      status: 200,
      element: <Suggest />,
      fallback: <PageFallback className="suggest-page" heading="Suggest a Dock" />,
    };
  if (path === "/privacy")
    return {
      key: path,
      nav: "",
      title: pageTitle("Privacy"),
      description: `What ${SITE.name} stores, and what it never does.`,
      canonical: path,
      status: 200,
      element: <Privacy />,
    };
  if (retiredPaths.has(path))
    return {
      key: path,
      nav: "",
      title: pageTitle("Moved"),
      description: "App requests, votes and icon uploads are no longer part of the site.",
      status: 200,
      noindex: true,
      element: <RetiredCommunity />,
    };
  if (path.startsWith("/docks/")) {
    const found = findDock(path.slice(7));
    if (!found) return notFound();
    const { dock } = found;
    return {
      key: path,
      nav: "/",
      title: pageTitle(dock.title),
      description: `${dock.summary} ${dock.apps.length} apps, in order.`,
      canonical: `/docks/${dock.id}`,
      status: 200,
      noindex: dock.status !== "published",
      element: <CollectionDetail item={dock} />,
    };
  }
  return notFound();
}

export function staticPaths() {
  const docks = allDocks.flatMap((dock) => [dock.id, ...dock.aliases]).map((slug) => `/docks/${slug}`);
  return ["/", "/latest", "/submit", "/privacy", ...retiredPaths, ...docks];
}
export const clientShellPaths = ["/dock", "/create"];

export function App({ match }: { match: RouteMatch }) {
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.querySelector<HTMLElement>("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <Header route={match.nav} />
      <Suspense fallback={match.fallback ?? <PageFallback />}>{match.element}</Suspense>
      <Footer />
    </>
  );
}
