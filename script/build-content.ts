// Validates content/ and writes src/generated/docks.json (gitignored).
// Run with --report for curation notes that do not fail the build.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { catalog, byId } from "../src/lib/dock.js";
import {
  ContentError,
  validateCollections,
  validateDocks,
  type DockRecord,
} from "../src/lib/schema.js";

const root = path.resolve(import.meta.dirname, "..");

export async function loadContent(): Promise<DockRecord[]> {
  const collections = validateCollections(
    JSON.parse(await readFile(path.join(root, "content/collections.json"), "utf8")),
  );
  const directory = path.join(root, "content/docks");
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  const sources = [];
  const problems: string[] = [];
  for (const name of files) {
    const file = `content/docks/${name}`;
    try {
      sources.push({ file, value: JSON.parse(await readFile(path.join(directory, name), "utf8")) });
    } catch (error) {
      problems.push(`${file}: ${error instanceof Error ? error.message : "invalid JSON"}`);
    }
  }
  if (problems.length) throw new ContentError(problems);
  return validateDocks(sources, {
    collections,
    activeAppIds: new Set(catalog.map((app) => app.id)),
    knownAppIds: new Set(byId.keys()),
  });
}

function report(docks: DockRecord[]) {
  const published = docks.filter((dock) => dock.status === "published");
  const notes: string[] = [];
  for (const dock of published) {
    if (dock.apps.length < 6) notes.push(`${dock.id}: only ${dock.apps.length} apps`);
    if (dock.apps.includes("finder") && dock.apps[0] !== "finder")
      notes.push(`${dock.id}: Finder is not first (macOS always keeps it first)`);
    if (!dock.credit) notes.push(`${dock.id}: no credit`);
  }
  const usage = new Map<string, number>();
  for (const dock of published) for (const app of dock.apps) usage.set(app, (usage.get(app) ?? 0) + 1);
  for (const [app, count] of usage)
    if (count > published.length / 3)
      notes.push(`${app} appears in ${count} of ${published.length} Docks`);
  const unused = catalog.filter((app) => !usage.has(app.id)).map((app) => app.id);
  notes.push(`${unused.length} catalog apps are not in any Dock: ${unused.join(", ")}`);
  console.log(`Curation notes (${notes.length}):\n- ${notes.join("\n- ")}`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  try {
    const docks = await loadContent();
    await mkdir(path.join(root, "src/generated"), { recursive: true });
    await writeFile(
      path.join(root, "src/generated/docks.json"),
      JSON.stringify(docks, null, 2) + "\n",
    );
    console.log(`Content OK: ${docks.length} Docks.`);
    if (process.argv.includes("--report")) report(docks);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
