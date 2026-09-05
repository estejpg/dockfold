import test from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  decodeDock,
  encodeDock,
  MAX_APPS,
  parseDock,
  shareURL,
} from "../src/lib/dock";
import {
  collections,
  groups,
  collectionDock,
  latestCollections,
  matchesCollection,
} from "../src/lib/collections";
import { submissionURL } from "../src/lib/submission";
import { cachedBoard, fetchBoard } from "../src/lib/requests";

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
test("GitHub form prefill safely preserves special characters and the full fragment link", () => {
  const dock = {
    ...collectionDock(collections[0]),
    n: "Café & # <Dock>",
    t: "Name = value? 日本語",
  };
  const link = shareURL(dock, "https://dockfold.vercel.app");
  const url = new URL(submissionURL(dock, link));
  assert.equal(url.origin, "https://github.com");
  assert.equal(url.searchParams.get("dock-link"), link);
  assert.equal(url.searchParams.get("dock-name"), dock.n);
  assert.equal(url.searchParams.get("description"), dock.t);
  assert.equal(url.searchParams.get("template"), "dock-submission.yml");
  assert.equal(url.hash, "");
});
test("future-dated browser cache is rejected", (t) => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        requests: [],
        fetchedAt: Date.now() + 86_400_000,
        truncated: false,
      }),
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  t.after(() => Reflect.deleteProperty(globalThis, "sessionStorage"));
  assert.equal(cachedBoard(), undefined);
});
test("request deadline cancels stalled loading and preserves a retryable error", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(
    globalThis,
    "fetch",
    (_url: unknown, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal!.addEventListener(
          "abort",
          () => reject(options.signal!.reason),
          { once: true },
        );
      }),
  );
  const pending = fetchBoard(new AbortController().signal, true);
  t.mock.timers.tick(10_000);
  await assert.rejects(pending, /too long to respond/);
});
test("paginated requests deduplicate issues before ranking thumbs-up votes", async (t) => {
  const issue = (number: number, votes: number) => ({
    number,
    title: `[App request] App ${number}`,
    labels: [{ name: "app-request" }],
    reactions: { "+1": votes },
    created_at: "2026-09-04",
  });
  let page = 0;
  t.mock.method(globalThis, "fetch", async () => {
    page++;
    return new Response(
      JSON.stringify(
        page === 1 ? [issue(1, 1), issue(2, 2)] : [issue(2, 3), issue(3, 0)],
      ),
      {
        headers:
          page === 1 ? { link: '<https://api.github.com>; rel="next"' } : {},
      },
    );
  });
  const board = await fetchBoard(new AbortController().signal, true);
  assert.equal(page, 2);
  assert.deepEqual(
    board.requests.map((item) => [item.number, item.votes]),
    [
      [2, 3],
      [1, 1],
      [3, 0],
    ],
  );
});
