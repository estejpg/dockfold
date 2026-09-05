import test from "node:test";
import assert from "node:assert/strict";
import { requestFields, jsonBody, validateOrigin } from "../server/http";
import { parseCatalog } from "../src/lib/live-catalog";
import {
  byId,
  DRAFT_KEY,
  decodeDock,
  encodeDock,
  readDraft,
} from "../src/lib/dock";

test("requests validate URLs and lengths, discard untrusted roles, and normalize exact duplicates", () => {
  const a = requestFields({
    name: " Test App ",
    website: "https://www.example.com/app/?tracking=1#private",
    notes: "Hello",
    status: "included",
    reviewer: true,
  });
  const b = requestFields({
    name: "test app",
    website: "https://example.com/app",
  });
  assert.equal(a.matchKey, b.matchKey);
  assert.equal(a.website, "https://www.example.com/app/?tracking=1");
  assert.deepEqual(Object.keys(a).sort(), [
    "matchKey",
    "name",
    "notes",
    "website",
  ]);
  for (const website of [
    "javascript:alert(1)",
    "file:///tmp/a",
    "https://user:pass@example.com",
    "not a URL",
  ])
    assert.throws(() => requestFields({ name: "Test", website }));
  assert.throws(() =>
    requestFields({ name: "x".repeat(81), website: "https://example.com" }),
  );
  assert.throws(() =>
    requestFields({
      name: "Test",
      website: "https://example.com",
      company: "bot",
    }),
  );
  assert.throws(() =>
    requestFields({ name: "Test\u0000", website: "https://example.com" }),
  );
});
test("anonymous form writes require an exact site origin and bounded JSON", async () => {
  assert.throws(() =>
    validateOrigin(
      new Request("https://dockfold.vercel.app/api/community", {
        headers: { origin: "https://dockfold.vercel.app.evil.example" },
      }),
    ),
  );
  validateOrigin(
    new Request("https://dockfold.vercel.app/api/community", {
      headers: { origin: "https://dockfold.vercel.app" },
    }),
  );
  for (const text of [
    "[]",
    "null",
    "invalid",
    JSON.stringify({ notes: "a".repeat(8192) }),
  ])
    await assert.rejects(
      jsonBody(
        new Request("https://example.com", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: text,
        }),
      ),
    );
});
test("live catalog rejects remote or malformed image paths and duplicate or bundled IDs", () => {
  const id = "community-4ab3c779-03f1-4de9-8d2f-9912b63cfd45";
  const app = {
    id,
    name: "Test",
    category: "Design",
    active: false,
    icon: `/api/catalog-icon?id=${id}&v=${"a".repeat(64)}`,
  };
  assert.deepEqual(parseCatalog([app]), [app]);
  for (const bad of [
    { ...app, icon: "https://evil.example/icon.svg" },
    { ...app, id: "safari" },
    { ...app, active: "true" },
    { ...app, icon: app.icon + "&redirect=https://example.com" },
  ])
    assert.throws(() => parseCatalog([bad]));
  assert.throws(() => parseCatalog([app, app]));
});
test("unknown dynamic apps survive draft loading until catalog recovery; retired apps remain shareable", (t) => {
  const id = "community-4ab3c779-03f1-4de9-8d2f-9912b63cfd45";
  const dock = { v: 2 as const, a: [id], n: "My saved Dock", t: "" };
  const saved = JSON.stringify(dock);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key: string) => (key === DRAFT_KEY ? saved : null) },
  });
  t.after(() => {
    Reflect.deleteProperty(globalThis, "localStorage");
    byId.delete(id);
  });
  assert.deepEqual(readDraft(), dock);
  assert.throws(() => encodeDock(dock));
  byId.set(id, {
    id,
    name: "Retired app",
    category: "Utilities",
    icon: "/api/catalog-icon",
  });
  assert.deepEqual(decodeDock(encodeDock(dock)), dock);
});
