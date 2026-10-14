import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { App } from "../lib/dock";
import { SITE } from "../lib/site";

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

const subscribeTheme = (callback: () => void) => {
  window.addEventListener("dockfold-theme", callback);
  return () => window.removeEventListener("dockfold-theme", callback);
};

function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme ?? "light",
    () => "light",
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
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} appearance`}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

const primary = [
  ["/", "Home"],
  ["/latest", "Latest"],
  ["/collections", "Collections"],
] as const;

export function Header({ route }: { route: string }) {
  return (
    <header className="site-header">
      <a href="/" className="wordmark" aria-label={`${SITE.name} home`}>
        <img className="brand-mark" src="/assets/link-icon.svg" width={24} height={24} alt="" />
        {SITE.name}
      </a>
      <nav aria-label="Primary navigation" className="primary-nav">
        {primary.map(([href, label]) => (
          <a key={href} href={href} aria-current={route === href ? "page" : undefined}>
            {label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <a
          className="suggest-link"
          href="/submit"
          aria-current={route === "/submit" ? "page" : undefined}
        >
          Suggest a Dock
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <a className="footer-brand" href="/">
          {SITE.name}
        </a>
        <p>
          {SITE.tagline} Nothing to install, nothing scanned.
          <br />
          Made by <a href={SITE.authorUrl}>{SITE.author}</a>. Independent of the app developers.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/">Home</a>
        <a href="/latest">Latest</a>
        <a href="/collections">Collections</a>
        <a href="/apps">Apps</a>
        <a href="/submit">Suggest a Dock</a>
        <a href="/create">Create your Dock</a>
        <a href="/about">About</a>
        <a href="/privacy">Privacy</a>
        <a href={SITE.source}>Source</a>
      </nav>
    </footer>
  );
}
