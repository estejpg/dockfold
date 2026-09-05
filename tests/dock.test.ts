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
