export type StackItem =
  | { kind: "folder"; label: string; view: "fan" | "grid" | "list" }
  | { kind: "trash" };
export type DockLayout = { spacers: number[]; stacks: StackItem[] };
export type DockStatus = "published" | "unlisted" | "retired";
export type DockRecord = {
  id: string;
  title: string;
  summary: string;
  note: string;
  collection: string;
  apps: string[];
  addedOn: string;
  updatedOn?: string;
  status: DockStatus;
  aliases: string[];
  credit?: string;
  creditUrl?: string;
  featured?: number;
  layout: DockLayout;
};
export type CollectionRecord = {
  id: string;
  name: string;
  shortName: string;
  description: string;
};

export const MAX_DOCK_APPS = 40;
// macOS always keeps Trash at the end; Downloads is the default stack.
export const DEFAULT_STACKS: StackItem[] = [
  { kind: "folder", label: "Downloads", view: "fan" },
  { kind: "trash" },
];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dockKeys = new Set([
  "id",
  "title",
  "summary",
  "note",
  "collection",
  "apps",
  "addedOn",
  "updatedOn",
  "status",
  "aliases",
  "credit",
  "creditUrl",
  "featured",
  "layout",
]);

export class ContentError extends Error {
  constructor(readonly problems: string[]) {
    super(`Content check failed:\n- ${problems.join("\n- ")}`);
  }
}

type Report = (message: string) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function plainText(
  value: unknown,
  label: string,
  max: number,
  report: Report,
  required = true,
): string | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || (required && !value.trim())) {
    report(`${label} is required`);
    return undefined;
  }
  if (value !== value.trim()) report(`${label} has leading or trailing spaces`);
  if (value.length > max) report(`${label} is longer than ${max} characters`);
  if ([...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))
    report(`${label} contains control characters`);
  return value;
}

function validDate(value: unknown, label: string, report: Report, required = true) {
  if (value === undefined && !required) return undefined;
  if (
    typeof value !== "string" ||
    !datePattern.test(value) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    report(`${label} must be a real YYYY-MM-DD date`);
    return undefined;
  }
  return value;
}

export function validateCollections(values: unknown): CollectionRecord[] {
  const problems: string[] = [];
  if (!Array.isArray(values) || values.length === 0)
    throw new ContentError(["content/collections.json must be a non-empty array"]);
  const seen = new Set<string>();
  const result = values.map((value, index) => {
    const report = (message: string) => problems.push(`collections[${index}]: ${message}`);
    if (!isRecord(value)) {
      report("must be an object");
      return undefined;
    }
    const id = value.id;
    if (typeof id !== "string" || !slugPattern.test(id)) report("id must be a lowercase slug");
    else if (seen.has(id)) report(`duplicate id ${id}`);
    else seen.add(id);
    for (const key of Object.keys(value))
      if (!["id", "name", "shortName", "description"].includes(key))
        report(`unknown field ${key}`);
    return {
      id: id as string,
      name: plainText(value.name, "name", 40, report) ?? "",
      shortName: plainText(value.shortName, "shortName", 20, report) ?? "",
      description: plainText(value.description, "description", 120, report) ?? "",
    };
  });
  if (problems.length) throw new ContentError(problems);
  return result as CollectionRecord[];
}

function validateLayout(
  value: unknown,
  appCount: number,
  report: Report,
): DockLayout {
  if (value === undefined) return { spacers: [], stacks: DEFAULT_STACKS };
  if (!isRecord(value)) {
    report("layout must be an object");
    return { spacers: [], stacks: DEFAULT_STACKS };
  }
  for (const key of Object.keys(value))
    if (key !== "spacers" && key !== "stacks") report(`layout has unknown field ${key}`);
  const spacers: number[] = [];
  if (value.spacers !== undefined) {
    if (!Array.isArray(value.spacers)) report("layout.spacers must be an array");
    else
      for (const spacer of value.spacers) {
        if (!Number.isInteger(spacer) || spacer < 0 || spacer >= appCount - 1)
          report(`layout.spacers: ${String(spacer)} must be an app index before the last app`);
        else if (spacers.includes(spacer)) report(`layout.spacers repeats ${spacer}`);
        else spacers.push(spacer);
      }
  }
  let stacks = DEFAULT_STACKS;
  if (value.stacks !== undefined) {
    const items: unknown = value.stacks;
    if (!Array.isArray(items) || items.length === 0 || items.length > 5) {
      report("layout.stacks must list one to five items");
    } else {
      stacks = items.map((item, index): StackItem => {
        const where = `layout.stacks[${index}]`;
        if (isRecord(item) && item.kind === "trash") {
          if (index !== items.length - 1) report(`${where}: Trash must be last`);
          return { kind: "trash" };
        }
        if (isRecord(item) && item.kind === "folder") {
          const view = item.view ?? "fan";
          if (view !== "fan" && view !== "grid" && view !== "list")
            report(`${where}.view must be fan, grid or list`);
          return {
            kind: "folder",
            label: plainText(item.label, `${where}.label`, 24, report) ?? "",
            view: view as "fan" | "grid" | "list",
          };
        }
        report(`${where}.kind must be folder or trash`);
        return { kind: "trash" };
      });
      if (stacks.at(-1)?.kind !== "trash") report("layout.stacks must end with Trash");
    }
  }
  return { spacers: spacers.sort((a, b) => a - b), stacks };
}

export type DockSource = { file: string; value: unknown };
export type CatalogContext = {
  collections: CollectionRecord[];
  activeAppIds: Set<string>;
  knownAppIds: Set<string>;
};

export function validateDocks(
  sources: DockSource[],
  context: CatalogContext,
): DockRecord[] {
  const problems: string[] = [];
  const collectionIds = new Set(context.collections.map((item) => item.id));
  const slugs = new Map<string, string>();
  const featuredOrders = new Map<number, string>();
  const docks: DockRecord[] = [];
  for (const { file, value } of sources) {
    const report = (message: string) => problems.push(`${file}: ${message}`);
    if (!isRecord(value)) {
      report("must contain a JSON object");
      continue;
    }
    for (const key of Object.keys(value))
      if (!dockKeys.has(key)) report(`unknown field ${key}`);
    const id = value.id;
    if (typeof id !== "string" || !slugPattern.test(id) || id.length > 60) {
      report("id must be a lowercase slug of up to 60 characters");
      continue;
    }
    if (!file.endsWith(`/${id}.json`) && file !== `${id}.json`)
      report(`file name must be ${id}.json`);
    const claim = (slug: string, label: string) => {
      const owner = slugs.get(slug);
      if (owner) report(`${label} ${slug} is already used by ${owner}`);
      else slugs.set(slug, id);
    };
    claim(id, "id");
    const status = value.status ?? "published";
    if (status !== "published" && status !== "unlisted" && status !== "retired")
      report("status must be published, unlisted or retired");
    const aliases: string[] = [];
    if (value.aliases !== undefined) {
      if (!Array.isArray(value.aliases)) report("aliases must be an array");
      else
        for (const alias of value.aliases) {
          if (typeof alias !== "string" || !slugPattern.test(alias))
            report(`alias ${String(alias)} must be a lowercase slug`);
          else {
            claim(alias, "alias");
            aliases.push(alias);
          }
        }
    }
    const collection = value.collection;
    if (typeof collection !== "string" || !collectionIds.has(collection))
      report(`collection ${String(collection)} is not in content/collections.json`);
    const apps: string[] = [];
    if (!Array.isArray(value.apps) || value.apps.length === 0) report("apps must list at least one app");
    else {
      if (value.apps.length > MAX_DOCK_APPS) report(`apps can list at most ${MAX_DOCK_APPS} apps`);
      for (const app of value.apps) {
        if (typeof app !== "string" || !context.knownAppIds.has(app))
          report(`app ${String(app)} is not in the catalog`);
        else if (status === "published" && !context.activeAppIds.has(app))
          report(`app ${app} is retired; published Docks must use the current catalog`);
        else if (apps.includes(app)) report(`app ${app} is listed twice`);
        else apps.push(app);
      }
    }
    const addedOn = validDate(value.addedOn, "addedOn", report);
    const updatedOn = validDate(value.updatedOn, "updatedOn", report, false);
    if (addedOn && updatedOn && updatedOn < addedOn) report("updatedOn is before addedOn");
    const creditUrl = value.creditUrl;
    if (creditUrl !== undefined) {
      let valid = false;
      try {
        valid =
          typeof creditUrl === "string" &&
          creditUrl.length <= 200 &&
          new URL(creditUrl).protocol === "https:";
      } catch {
        valid = false;
      }
      if (!valid) report("creditUrl must be an https URL of up to 200 characters");
      if (value.credit === undefined) report("creditUrl needs a credit");
    }
    let featured: number | undefined;
    if (value.featured !== undefined) {
      if (!Number.isInteger(value.featured) || (value.featured as number) < 1)
        report("featured must be a positive whole number (its order)");
      else {
        featured = value.featured as number;
        const owner = featuredOrders.get(featured);
        if (owner) report(`featured order ${featured} is already used by ${owner}`);
        featuredOrders.set(featured, id);
        if (status !== "published") report("only published Docks can be featured");
      }
    }
    const record: DockRecord = {
      id,
      title: plainText(value.title, "title", 60, report) ?? "",
      summary: plainText(value.summary, "summary", 140, report) ?? "",
      note: plainText(value.note, "note", 600, report) ?? "",
      collection: collection as string,
      apps,
      addedOn: addedOn ?? "",
      status: status as DockStatus,
      aliases,
      layout: validateLayout(value.layout, apps.length, report),
    };
    if (updatedOn) record.updatedOn = updatedOn;
    const credit = plainText(value.credit, "credit", 80, report, false);
    if (credit) record.credit = credit;
    if (typeof creditUrl === "string") record.creditUrl = creditUrl;
    if (featured) record.featured = featured;
    docks.push(record);
  }
  if (problems.length) throw new ContentError(problems);
  return docks.sort(
    (a, b) => a.addedOn.localeCompare(b.addedOn) || a.title.localeCompare(b.title),
  );
}
