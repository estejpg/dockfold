import generated from "../generated/docks.json" with { type: "json" };
import { byId, type Dock } from "./dock.js";
import type { DockRecord } from "./schema.js";
import { collectionById, collections } from "./taxonomy.js";

export type { DockRecord } from "./schema.js";
export const allDocks = generated as unknown as DockRecord[];
export const publishedDocks = allDocks.filter((dock) => dock.status === "published");

const bySlug = new Map<string, { dock: DockRecord; alias: boolean }>();
for (const dock of allDocks) {
  bySlug.set(dock.id, { dock, alias: false });
  for (const alias of dock.aliases) bySlug.set(alias, { dock, alias: true });
}
export function findDock(slug: string) {
  return bySlug.get(slug);
}

const newestFirst = (a: DockRecord, b: DockRecord) =>
  b.addedOn.localeCompare(a.addedOn) || a.title.localeCompare(b.title);

export function latestDocks() {
  return [...publishedDocks].sort(newestFirst);
}
export function featuredDocks() {
  return publishedDocks
    .filter((dock) => dock.featured)
    .sort((a, b) => a.featured! - b.featured!);
}
export function docksInCollection(id: string) {
  return publishedDocks.filter((dock) => dock.collection === id).sort(newestFirst);
}
export function docksWithApp(appId: string) {
  return publishedDocks.filter((dock) => dock.apps.includes(appId)).sort(newestFirst);
}
export function appsInDocks() {
  const counts = new Map<string, number>();
  for (const dock of publishedDocks)
    for (const app of dock.apps) counts.set(app, (counts.get(app) ?? 0) + 1);
  return counts;
}
export function relatedDocks(dock: DockRecord, limit = 3) {
  return publishedDocks
    .filter((other) => other.id !== dock.id)
    .map((other) => ({
      other,
      score:
        other.apps.filter((app) => dock.apps.includes(app)).length * 2 +
        (other.collection === dock.collection ? 1 : 0),
    }))
    .filter(({ score }) => score > 1)
    .sort((a, b) => b.score - a.score || newestFirst(a.other, b.other))
    .slice(0, limit)
    .map(({ other }) => other);
}
export function neighbours(dock: DockRecord) {
  const order = latestDocks();
  const index = order.findIndex((item) => item.id === dock.id);
  if (index < 0) return { newer: undefined, older: undefined };
  return { newer: order[index - 1], older: order[index + 1] };
}

export const sizes = [
  { id: "minimal", label: "Minimal", hint: "Five apps or fewer" },
  { id: "balanced", label: "Balanced", hint: "Six to eleven apps" },
  { id: "full", label: "Full", hint: "Twelve apps or more" },
] as const;
export type SizeId = (typeof sizes)[number]["id"];
export function sizeOf(dock: DockRecord): SizeId {
  return dock.apps.length <= 5 ? "minimal" : dock.apps.length <= 11 ? "balanced" : "full";
}

export function collectionName(id: string) {
  return collectionById.get(id)?.name ?? id;
}
export function matchesDock(dock: DockRecord, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return [
    dock.title,
    dock.summary,
    collectionName(dock.collection),
    dock.credit ?? "",
    ...dock.apps.map((id) => byId.get(id)?.name ?? ""),
  ]
    .join(" ")
    .toLocaleLowerCase()
    .includes(needle);
}
export function shareableDock(dock: DockRecord): Dock {
  return { v: 2, n: dock.title, t: dock.summary, a: [...dock.apps] };
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function formatDay(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function formatMonth(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
export { collections };
