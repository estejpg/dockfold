import { byId, catalog, type App } from "./dock";
import { communityFetch, type CatalogApp } from "./community";
type State = {
  status: "idle" | "loading" | "ready" | "error";
  revision: number;
};
let state: State = { status: "idle", revision: 0 };
const listeners = new Set<() => void>();
const bundled = [...catalog];
export const catalogSnapshot = () => state;
export const subscribeCatalog = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
function update(status: State["status"]) {
  state = { status, revision: state.revision + 1 };
  listeners.forEach((listener) => listener());
}
export function parseCatalog(value: unknown): CatalogApp[] {
  if (!Array.isArray(value) || value.length > 5000)
    throw new Error("Invalid catalog");
  const ids = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Invalid app");
    const { id, name, category, icon, active } = item;
    if (
      typeof id !== "string" ||
      !/^community-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        id,
      ) ||
      ids.has(id) ||
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 80 ||
      typeof category !== "string" ||
      !category.trim() ||
      category.length > 40 ||
      typeof icon !== "string" ||
      !new RegExp(`^/api/catalog-icon\\?id=${id}&v=[a-f0-9]{64}$`).test(icon) ||
      typeof active !== "boolean"
    )
      throw new Error("Invalid catalog app");
    ids.add(id);
    return { id, name, category, icon, active };
  });
}
// Used when the community service is not configured for this deployment: the
// bundled catalog is complete, so gates and pickers can proceed without a request.
export function settleCatalog() {
  if (state.status === "idle") update("ready");
}
export async function loadCatalog(force = false) {
  if (state.status === "loading" || (!force && state.status === "ready"))
    return;
  update("loading");
  try {
    const result = await communityFetch<{ apps: unknown }>("catalog");
    const apps = parseCatalog(result.apps);
    for (const app of apps) byId.set(app.id, app as App);
    catalog.splice(
      0,
      catalog.length,
      ...bundled,
      ...apps.filter((app) => app.active),
    );
    update("ready");
  } catch {
    update("error");
  }
}
