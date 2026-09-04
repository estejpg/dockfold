import type { DockApp, GalleryProfile } from "@/lib/types";

export const appCatalog: Record<string, DockApp & { icon: string }> = {
  figma: { name: "Figma", bundleIdentifier: "com.figma.Desktop", iconKey: "figma", icon: "/app-icons/figma.png" },
  notion: { name: "Notion", bundleIdentifier: "notion.id", iconKey: "notion", icon: "/app-icons/notion.png" },
  spotify: { name: "Spotify", bundleIdentifier: "com.spotify.client", iconKey: "spotify", icon: "/app-icons/spotify.png" },
  slack: { name: "Slack", bundleIdentifier: "com.tinyspeck.slackmacgap", iconKey: "slack", icon: "/app-icons/slack.png" },
  chrome: { name: "Google Chrome", bundleIdentifier: "com.google.Chrome", iconKey: "chrome", icon: "/app-icons/chrome.png" },
  safari: { name: "Safari", bundleIdentifier: "com.apple.Safari", iconKey: "safari", icon: "/app-icons/safari.png" },
  vscode: { name: "Visual Studio Code", bundleIdentifier: "com.microsoft.VSCode", iconKey: "vscode", icon: "/app-icons/vscode.png" },
  arc: { name: "Arc", bundleIdentifier: "company.thebrowser.Browser", iconKey: "arc", icon: "/app-icons/arc.png" },
  obsidian: { name: "Obsidian", bundleIdentifier: "md.obsidian", iconKey: "obsidian", icon: "/app-icons/obsidian.png" },
  terminal: { name: "Terminal", bundleIdentifier: "com.apple.Terminal", iconKey: "terminal", icon: "/app-icons/terminal.png" },
};

const apps = (...keys: Array<keyof typeof appCatalog>): DockApp[] => keys.map((key) => appCatalog[key]);

export const galleryProfiles: GalleryProfile[] = [
  {
    slug: "mina-park",
    v: 1,
    name: "Design desk",
    role: "Product design",
    note: "Sketch, prototype, and stay in the loop.",
    category: "Design",
    backdrop: "sky",
    publishedAt: "2026-09-02",
    apps: apps("safari", "figma", "notion", "slack", "chrome", "arc"),
  },
  {
    slug: "theo-martins",
    v: 1,
    name: "Build & ship",
    role: "Development",
    note: "Code, test, ship, repeat.",
    category: "Development",
    backdrop: "night",
    publishedAt: "2026-09-01",
    apps: apps("vscode", "terminal", "notion", "slack", "chrome", "spotify"),
  },
  {
    slug: "june-walker",
    v: 1,
    name: "Reading room",
    role: "Writing",
    note: "Write, research, and keep notes.",
    category: "Writing",
    backdrop: "paper",
    publishedAt: "2026-08-29",
    apps: apps("safari", "obsidian", "notion", "spotify", "slack"),
  },
  {
    slug: "samir-rao",
    v: 1,
    name: "After hours",
    role: "Music",
    note: "Listen, discover, and collect.",
    category: "Music",
    backdrop: "ink",
    publishedAt: "2026-08-26",
    apps: apps("spotify", "safari", "obsidian"),
  },
];

export const topApps: [string, number][] = Object.keys(appCatalog)
  .map(key => [key, galleryProfiles.filter(profile => profile.apps.some(app => app.bundleIdentifier === appCatalog[key].bundleIdentifier)).length] as [string, number])
  .sort((a, b) => b[1] - a[1] || appCatalog[a[0]].name.localeCompare(appCatalog[b[0]].name)).slice(0, 5);

export function resolveIcon(app: DockApp) {
  if (app.iconKey && Object.hasOwn(appCatalog, app.iconKey)) return appCatalog[app.iconKey].icon;
  const match = Object.values(appCatalog).find((item) => item.bundleIdentifier === app.bundleIdentifier || item.name.toLowerCase() === app.name.toLowerCase());
  return match?.icon;
}
