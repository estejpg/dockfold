import catalogData from "./catalog.json";
import legacyCatalog from "./legacy-catalog.json";
export const catalog = catalogData;
export type App = (typeof catalog)[number];
export const byId = new Map(
  [...legacyCatalog, ...catalog].map((app) => [app.id, app]),
);
export type Dock = { v: 2; a: string[]; n: string; t: string };
export const DRAFT_KEY = "dockfold:draft:v2";
export const MAX_APPS = 40;
export const emptyDock = (): Dock => ({
  v: 2,
  a: [],
  n: "My everyday Dock",
  t: "",
});

export function parseDock(value: unknown, allowEmpty = false): Dock {
  if (!value || typeof value !== "object")
    throw new Error("This Dock link is incomplete.");
  const dock = value as Record<string, unknown>;
  if (
    dock.v !== 2 ||
    !Array.isArray(dock.a) ||
    dock.a.length > MAX_APPS ||
    (!allowEmpty && dock.a.length === 0) ||
    !dock.a.every((id) => typeof id === "string" && byId.has(id)) ||
    new Set(dock.a).size !== dock.a.length ||
    typeof dock.n !== "string" ||
    dock.n.length > 60 ||
    (!allowEmpty && !dock.n.trim()) ||
    typeof dock.t !== "string" ||
    dock.t.length > 180
  )
    throw new Error(
      "This Dock link is invalid or uses apps that are unavailable.",
    );
  return { v: 2, a: [...dock.a], n: dock.n, t: dock.t };
}
export function encodeDock(dock: Dock) {
  const bytes = new TextEncoder().encode(JSON.stringify(parseDock(dock)));
  const encoded = btoa(
    Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  if (encoded.length > 4096)
    throw new Error("This Dock is too large to share.");
  return encoded;
}
export function decodeDock(payload: string): Dock {
  if (
    payload.length > 4096 ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    payload.length % 4 === 1
  )
    throw new Error("This Dock link is incomplete or too long.");
  const padded =
    payload.replaceAll("-", "+").replaceAll("_", "/") +
    "=".repeat((4 - (payload.length % 4)) % 4);
  return parseDock(
    JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)),
      ),
    ),
  );
}
export function readDraft(): Dock {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved && saved.length <= 4096
      ? parseDock(JSON.parse(saved), true)
      : emptyDock();
  } catch {
    return emptyDock();
  }
}
export function moveApp(ids: string[], id: string, direction: -1 | 1) {
  const index = ids.indexOf(id),
    next = index + direction;
  if (index < 0 || next < 0 || next >= ids.length) return ids;
  const reordered = [...ids];
  [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
  return reordered;
}
export const examples: { dock: Dock; category: string }[] = [
  {
    category: "Design",
    dock: {
      v: 2,
      n: "Design desk",
      t: "Sketch, prototype, and stay in the loop.",
      a: ["safari", "figma", "notion", "slack", "chrome", "arc"],
    },
  },
  {
    category: "Development",
    dock: {
      v: 2,
      n: "Build & ship",
      t: "Code, test, ship, repeat.",
      a: ["vscode", "terminal", "notion", "slack", "chrome", "spotify"],
    },
  },
  {
    category: "Writing",
    dock: {
      v: 2,
      n: "Reading room",
      t: "Write, research, and keep notes.",
      a: ["safari", "obsidian", "notion", "spotify"],
    },
  },
  {
    category: "Music",
    dock: {
      v: 2,
      n: "After hours",
      t: "Listen, discover, and collect.",
      a: ["spotify", "safari", "obsidian"],
    },
  },
];

export function shareURL(dock: Dock, origin: string = location.origin) {
  return `${origin}/dock#dock=${encodeDock(dock)}`;
}
export function customizeURL(dock: Dock) {
  return `/submit#dock=${encodeDock(dock)}`;
}
