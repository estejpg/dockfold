import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { byId, type App } from "../lib/dock";
const subscribeTheme = (cb: () => void) => {
  window.addEventListener("dockfold-theme", cb);
  return () => window.removeEventListener("dockfold-theme", cb);
};
export function AppIcon({ app, size = 54 }: { app: App; size?: number }) {
  return (
    <img
      className="app-icon"
      src={app.icon}
      width={size}
      height={size}
      alt=""
      draggable="false"
      decoding="async"
      loading="lazy"
    />
  );
}
export function DockStrip({
  ids,
  compact = false,
}: {
  ids: string[];
  compact?: boolean;
}) {
  return (
    <div
      className={`dock-strip${compact ? " compact-dock" : ""}`}
      role="img"
      aria-label={`Dock: ${ids.map((id) => byId.get(id)?.name).join(", ")}`}
    >
      {ids.map((id) => {
        const app = byId.get(id);
        return app ? (
          <span className="dock-app" key={id}>
            <AppIcon app={app} size={compact ? 32 : 64} />
            <span className="dock-tooltip" aria-hidden="true">
              {app.name}
            </span>
          </span>
        ) : null;
      })}
    </div>
  );
}
export function Header({ route }: { route: string }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme ?? "light",
  );
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("dockfold:theme", next);
    } catch {
      /* appearance still changes for this visit */
    }
    window.dispatchEvent(new Event("dockfold-theme"));
  }
  return (
    <header className="site-header">
      <div className="header-top">
        <a href="/" className="wordmark" aria-label="DockFold home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          DockFold
        </a>
        <nav aria-label="Primary navigation">
          {[
            ["/", "Home"],
            ["/latest", "Latest"],
            ["/submit", "Submit"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              aria-current={route === href ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          className="theme-toggle"
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} appearance`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
      <p className="site-description">
        Curated macOS Docks for work, ideas, and everything in between.
      </p>
    </header>
  );
}
export function Footer() {
  return (
    <footer>
      <div>
        <a className="footer-brand" href="/">
          DockFold
        </a>
        <p>
          A small directory of considered Docks.
          <br />
          Made by <a href="https://www.estejpg.com/">estejpg</a>.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/">Home</a>
        <a href="/latest">Latest</a>
        <a href="/submit">Submit</a>
        <a href="/requests">App requests</a>
        <a href="/contribute">Contribute an icon</a>
        <a href="/privacy">Privacy</a>
        <a href="https://github.com/estejpg/dockfold">Source</a>
      </nav>
    </footer>
  );
}
