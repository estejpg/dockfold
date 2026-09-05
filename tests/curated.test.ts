import test from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  decodeDock,
  encodeDock,
  MAX_APPS,
  parseDock,
} from "../src/lib/dock";
import {
  collections,
  groups,
  collectionDock,
  latestCollections,
  matchesCollection,
} from "../src/lib/collections";

test("every curated Dock uses supplied icons and can round-trip through sharing", () => {
  const ids = new Set(catalog.map((app) => app.id));
  assert.equal(
    collections.length,
    new Set(collections.map((dock) => dock.id)).size,
  );
  for (const item of collections) {
    assert.ok(
      groups.some((group) => group.id === item.group),
      item.id,
    );
    assert.ok(
      item.apps.every((id) => ids.has(id)),
      item.id,
    );
    assert.deepEqual(
      decodeDock(encodeDock(collectionDock(item))),
      collectionDock(item),
    );
    assert.match(item.addedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(item.addedOn)));
  }
  for (const group of groups)
    assert.ok(collections.some((item) => item.group === group.id));
});
test("directory search includes app names and latest does not mutate curated ordering", () => {
  const before = collections.map((item) => item.id);
  assert.equal(
    collections.filter((item) => matchesCollection(item, "ZOTERO")).length,
    2,
  );
  assert.equal(
    collections.filter((item) => matchesCollection(item, "no-such-app")).length,
    0,
  );
  const dates = latestCollections().map((item) => item.addedOn);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.deepEqual(
    collections.map((item) => item.id),
    before,
  );
});
test("maximum selection with full-length Unicode text remains shareable, 41 apps rejected", () => {
  const dock = {
    v: 2 as const,
    a: catalog.slice(0, MAX_APPS).map((app) => app.id),
    n: "日".repeat(60),
    t: "語".repeat(180),
  };
  assert.deepEqual(decodeDock(encodeDock(dock)), dock);
  assert.throws(() =>
    parseDock({
      ...dock,
      a: catalog.slice(0, MAX_APPS + 1).map((app) => app.id),
    }),
  );
});
