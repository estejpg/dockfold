import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { catalog, decodeDock, encodeDock, byId } from "../src/lib/dock";
import {
  allDocks,
  findDock,
  latestDocks,
  matchesDock,
  publishedDocks,
  relatedDocks,
  shareableDock,
  sizeOf,
} from "../src/lib/docks";
import { collections } from "../src/lib/taxonomy";
import {
  ContentError,
  DEFAULT_STACKS,
  validateDocks,
  type DockSource,
} from "../src/lib/schema";
import { loadContent } from "../script/build-content";

const publishedIds: string[] = JSON.parse(
  readFileSync("tests/fixtures/published-dock-ids.json", "utf8"),
);
const context = {
  collections,
  activeAppIds: new Set(catalog.map((app) => app.id)),
  knownAppIds: new Set(byId.keys()),
};
const base = {
  id: "quiet-desk",
  title: "Quiet desk",
  summary: "A small Dock.",
  collection: "everyday",
  addedOn: "2026-10-01",
  apps: ["finder", "notes"],
  note: "Two apps and room to think.",
};
const check = (value: Record<string, unknown>, file = `content/docks/${String(value.id)}.json`) =>
  validateDocks([{ file, value }] as DockSource[], context);
const rejects = (value: Record<string, unknown>, pattern: RegExp, file?: string) =>
  assert.throws(
    () => check(value, file),
    (error) => error instanceof ContentError && error.problems.some((p) => pattern.test(p)),
  );

test("every Dock URL that was ever published still resolves", () => {
  assert.ok(publishedIds.length >= 81);
  for (const id of publishedIds) assert.ok(findDock(id), `${id} no longer resolves`);
});

test("the generated module matches content/ exactly", async () => {
  assert.deepEqual(await loadContent(), allDocks);
});

test("published Docks use the catalog, belong to a collection and stay shareable", () => {
  for (const dock of publishedDocks) {
    assert.ok(collections.some((item) => item.id === dock.collection), dock.id);
    assert.ok(dock.apps.every((id) => catalog.some((app) => app.id === id)), dock.id);
    assert.deepEqual(decodeDock(encodeDock(shareableDock(dock))), shareableDock(dock));
    assert.equal(dock.layout.stacks.at(-1)?.kind, "trash");
  }
  for (const item of collections)
    assert.ok(publishedDocks.some((dock) => dock.collection === item.id), item.id);
});

test("records get defaults and keep optional fields", () => {
  const [dock] = check({ ...base, featured: 2, credit: "Ada", creditUrl: "https://example.com" });
  assert.equal(dock.status, "published");
  assert.deepEqual(dock.aliases, []);
  assert.deepEqual(dock.layout, { spacers: [], stacks: DEFAULT_STACKS });
  assert.equal(dock.featured, 2);
  assert.equal(dock.creditUrl, "https://example.com");
});

test("the content check rejects mistakes with the file name", () => {
  rejects({ ...base, colour: "blue" }, /quiet-desk\.json: unknown field colour/);
  rejects({ ...base, collection: "ads" }, /collection ads is not in/);
  rejects({ ...base, apps: ["finder", "not-an-app"] }, /not-an-app is not in the catalog/);
  rejects({ ...base, apps: ["finder", "finder"] }, /listed twice/);
  rejects({ ...base, apps: ["chrome"] }, /chrome is retired/);
  rejects({ ...base, addedOn: "2026-02-30" }, /real YYYY-MM-DD/);
  rejects({ ...base, title: " Padded" }, /leading or trailing/);
  rejects({ ...base, creditUrl: "http://example.com", credit: "A" }, /https URL/);
  rejects({ ...base, layout: { stacks: [{ kind: "trash" }, { kind: "folder", label: "Apps" }] } }, /Trash must be last/);
  rejects({ ...base, layout: { spacers: [1] } }, /before the last app/);
  rejects(base, /file name must be quiet-desk\.json/, "content/docks/other.json");
  assert.doesNotThrow(() => check({ ...base, status: "retired", apps: ["chrome"] }));
});

test("ids, aliases and featured orders must be unique across files", () => {
  const sources = [
    { file: "content/docks/a.json", value: { ...base, id: "a", aliases: ["old"], featured: 1 } },
    { file: "content/docks/b.json", value: { ...base, id: "b", aliases: ["old"], featured: 1 } },
  ];
  assert.throws(
    () => validateDocks(sources, context),
    (error) =>
      error instanceof ContentError &&
      error.problems.some((p) => /alias old is already used by a/.test(p)) &&
      error.problems.some((p) => /featured order 1 is already used by a/.test(p)),
  );
});

test("latest is newest first, search covers app names, related Docks share apps", () => {
  const dates = latestDocks().map((dock) => dock.addedOn);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.ok(publishedDocks.filter((dock) => matchesDock(dock, "ZOTERO")).length >= 2);
  assert.equal(publishedDocks.filter((dock) => matchesDock(dock, "no-such-app")).length, 0);
  const dock = findDock("cursor-desk")!.dock;
  for (const other of relatedDocks(dock))
    assert.ok(other.apps.some((app) => dock.apps.includes(app)));
  assert.equal(sizeOf({ ...dock, apps: Array(12).fill("x") }), "full");
});
