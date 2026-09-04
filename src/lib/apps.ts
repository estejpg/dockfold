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
    name: "Mina Park",
    role: "Product designer",
    note: "I sketch, prototype, and test. These apps keep the loop calm.",
    category: "Design",
    backdrop: "sky",
    publishedAt: "2026-09-02",
    apps: apps("safari", "figma", "notion", "slack", "chrome", "arc"),
  },
  {
    slug: "theo-martins",
    v: 1,
    name: "Theo Martins",
    role: "Independent developer",
    note: "Tiny tools, shipped daily. The Dock only keeps what earns a place.",
    category: "Development",
    backdrop: "night",
    publishedAt: "2026-09-01",
    apps: apps("vscode", "terminal", "notion", "slack", "chrome", "spotify"),
  },
  {
    slug: "june-walker",
    v: 1,
    name: "June Walker",
    role: "Writer & researcher",
    note: "Long reads, deep notes, and a quieter place to think.",
    category: "Writing",
    backdrop: "paper",
    publishedAt: "2026-08-29",
    apps: apps("safari", "obsidian", "notion", "spotify", "slack"),
  },
  {
    slug: "samir-rao",
    v: 1,
    name: "Samir Rao",
    role: "Creative technologist",
    note: "Code, visuals, and sound. A compact toolkit for interactive work.",
    category: "Music",
    backdrop: "ink",
    publishedAt: "2026-08-26",
    apps: apps("arc", "vscode", "figma", "spotify", "terminal", "obsidian"),
  },
];

export const topApps = [
  ["notion", 1284], ["vscode", 1172], ["figma", 1103], ["slack", 986], ["chrome", 951],
  ["spotify", 867], ["arc", 712], ["obsidian", 628], ["terminal", 612], ["safari", 589],
] as const;

export function resolveIcon(app: DockApp) {
  if (app.iconKey && appCatalog[app.iconKey]) return appCatalog[app.iconKey].icon;
  const match = Object.values(appCatalog).find((item) => item.bundleIdentifier === app.bundleIdentifier || item.name.toLowerCase() === app.name.toLowerCase());
  return match?.icon;
}
