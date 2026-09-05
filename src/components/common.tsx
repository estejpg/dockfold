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
    />
  );
}
export function DockStrip({ ids }: { ids: string[] }) {
  return (
    <div className="dock-strip" aria-label="Dock preview">
      {ids.map((id) => {
        const app = byId.get(id)!;
        return (
          <div className="dock-app" key={id}>
            <AppIcon app={app} />
            <span className="dock-tooltip">{app.name}</span>
            <span className="sr-only">{app.name}</span>
          </div>
        );
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
      /* preference remains for this visit */
    }
    window.dispatchEvent(new Event("dockfold-theme"));
  }
  return (
    <header className="site-header">
      <a className="wordmark" href="#/" aria-label="DockFold home">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
        </span>
        DockFold
      </a>
      <nav aria-label="Primary navigation">
        {[
          ["#/", "Build a Dock"],
          ["#/examples", "Examples"],
          ["#/requests", "App requests"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            aria-current={
              route === href || (href === "#/" && route.startsWith("#/build/"))
                ? "page"
                : undefined
            }
          >
            {label}
          </a>
        ))}
      </nav>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggle}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} appearance`}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
export function Footer() {
  return (
    <footer>
      <span>
        Made by <a href="https://www.estejpg.com/">estejpg</a>
      </span>
      <span>
        <a href="#/privacy">Privacy</a>
        <a href="https://github.com/estejpg/dockfold">Source</a>
      </span>
    </footer>
  );
}
