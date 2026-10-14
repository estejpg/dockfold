// Change the working name here; titles, metadata, the sitemap and the header follow.
export const SITE = {
  name: "DockFold",
  url: "https://dockfold.vercel.app",
  tagline: "macOS Docks, curated by hand.",
  description:
    "A hand-picked directory of macOS Docks for work, making and everything in between. Browse a setup, see every app in order, and make it yours.",
  author: "estejpg",
  authorUrl: "https://www.estejpg.com/",
  source: "https://github.com/estejpg/dockfold",
} as const;

export function pageTitle(title?: string) {
  return title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
}
