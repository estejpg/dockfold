import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  catalog,
  decodeDock,
  encodeDock,
  emptyDock,
  examples,
  moveApp,
  parseDock,
} from "../src/lib/dock";
import { parseIssues, rankRequests } from "../src/lib/requests";
const dock = {
  v: 2 as const,
  a: ["safari", "figma", "notion"],
  n: "Café 🧑🏽‍💻",
  t: "Design & write 日本語",
};
test("share links preserve Unicode, choices and order", () =>
  assert.deepEqual(decodeDock(encodeDock(dock)), dock));
test("catalog IDs are unique and every local icon exists", () => {
  assert.equal(new Set(catalog.map((a) => a.id)).size, catalog.length);
  for (const app of catalog) {
    assert.match(app.id, /^[a-z0-9-]+$/);
    assert.ok(existsSync(`public${app.icon}`), app.name);
  }
});
test("shared Dock rejects unknown apps, duplicates and empty choices", () => {
  for (const a of [[], ["unknown"], ["__proto__"], ["safari", "safari"]])
    assert.throws(() => parseDock({ ...dock, a }));
  assert.deepEqual(parseDock(emptyDock(), true), emptyDock());
});
test("untrusted fields are stripped; user text is plain data", () =>
  assert.deepEqual(
    parseDock({
      ...dock,
      n: "<img onerror=alert(1)>",
      path: "/Users/private",
      url: "javascript:alert(1)",
    }),
    { ...dock, n: "<img onerror=alert(1)>" },
  ));
test("bounded decoder rejects malformed, oversized and invalid UTF-8", () => {
  for (const value of ["", "a", "%%%", "a".repeat(4097), "_w"])
    assert.throws(() => decodeDock(value));
  for (const n of ["", "x".repeat(61)])
    assert.throws(() => parseDock({ ...dock, n }));
  assert.throws(() => parseDock({ ...dock, t: "x".repeat(181) }));
});
test("reordering preserves selection without moving beyond either end", () => {
  assert.deepEqual(moveApp(dock.a, "figma", -1), ["figma", "safari", "notion"]);
  assert.deepEqual(moveApp(dock.a, "safari", -1), dock.a);
  assert.deepEqual(moveApp(dock.a, "notion", 1), dock.a);
  assert.deepEqual(moveApp(dock.a, "missing", -1), dock.a);
});
test("all examples can be shared", () => {
  for (const { dock } of examples)
    assert.deepEqual(decodeDock(encodeDock(dock)), dock);
});
test("GitHub board counts thumbs-up only and excludes pull requests and unrelated issues", () => {
  const issue = {
    number: 8,
    title: "[App request] Test app",
    labels: [{ name: "app-request" }],
    created_at: "2026-09-04",
    reactions: { "+1": 7, total_count: 30 },
  };
  assert.deepEqual(
    parseIssues([
      issue,
      { ...issue, number: 9, pull_request: {} },
      { ...issue, number: 10, labels: [] },
    ]),
    [{ number: 8, name: "Test app", votes: 7, createdAt: "2026-09-04" }],
  );
  assert.equal(
    parseIssues([{ ...issue, reactions: { "+1": -1 } }])[0].votes,
    0,
  );
  assert.throws(() => parseIssues({}));
});
test("leaderboard sorts by votes with stable creation-order ties", () => {
  const item = (number: number, votes: number) => ({
    number,
    votes,
    name: "app",
    createdAt: "",
  });
  assert.deepEqual(
    rankRequests([item(3, 0), item(2, 2), item(1, 2)]).map((r) => r.number),
    [1, 2, 3],
  );
});
