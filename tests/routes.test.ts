import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveRoute } from "../src/app";
import { clientShellPaths, renderPage, sitemap, staticPaths } from "../src/entry-server";
import { encodeDock } from "../src/lib/dock";
import { allDocks, publishedDocks } from "../src/lib/docks";

const template = readFileSync("index.html", "utf8");
const escapeText = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
const publishedIds: string[] = JSON.parse(
  readFileSync("tests/fixtures/published-dock-ids.json", "utf8"),
);

test("every published Dock id gets a prerendered page", () => {
  const paths = new Set(staticPaths());
  for (const id of publishedIds) assert.ok(paths.has(`/docks/${id}`), id);
  for (const dock of allDocks) assert.ok(paths.has(`/docks/${dock.id}`), dock.id);
});

test("static pages render real content, metadata and a matching route key", async () => {
  const dock = publishedDocks[0];
  const { html, status } = await renderPage(`/docks/${dock.id}`, template);
  assert.equal(status, 200);
  assert.match(html, new RegExp(`<title>${dock.title} · `));
  assert.ok(html.includes(`data-route="/docks/${dock.id}"`));
  assert.ok(html.includes(`<link rel="canonical" href="https://dockfold.vercel.app/docks/${dock.id}" />`));
  assert.ok(html.includes(`<meta name="description" content="${escapeText(dock.summary).replaceAll("&#x27;", "'")}`));
  assert.ok(html.includes(escapeText(dock.note)));
  const home = await renderPage("/", template);
  assert.ok(home.html.includes('type="application/ld+json"'));
  assert.equal(home.html.match(/<title>/g)?.length, 1);
});

test("every static path renders with status 200", async () => {
  for (const path of staticPaths()) {
    const { status, match } = await renderPage(path, template);
    assert.equal(status, 200, path);
    assert.notEqual(match.key, "client", path);
  }
});

test("unknown paths are real 404s and client-only routes ship an empty shell", async () => {
  const missing = await renderPage("/docks/not-a-real-dock", template);
  assert.equal(missing.status, 404);
  assert.ok(missing.html.includes('<meta name="robots" content="noindex" />'));
  assert.equal(resolveRoute("/nope").key, "404");
  for (const path of clientShellPaths) {
    const { html } = await renderPage(path, template, "shell");
    assert.ok(html.includes('<div id="root"></div>'), path);
  }
});

test("hash links keep working: home variants hydrate, share links render on the client", () => {
  assert.equal(resolveRoute("/", "#/").key, "/");
  assert.equal(resolveRoute("/", "#/examples").key, "/");
  const payload = encodeDock({ v: 2, a: ["notes"], n: "Mine", t: "" });
  assert.equal(resolveRoute("/", `#/dock/${payload}`).key, "client");
  assert.equal(resolveRoute("/dock", `#dock=${payload}`).key, "client");
  assert.equal(resolveRoute("/dock", "#dock=%%%").status, 200);
  assert.equal(resolveRoute("/create", `#dock=${payload}`).nav, "/create");
  assert.equal(resolveRoute("/", "#/contribute").nav, "/submit");
});

test("collections and apps get pages; unknown or unused ones are 404s", () => {
  const paths = new Set(staticPaths());
  for (const path of ["/about", "/collections", "/collections/design", "/apps", "/apps/notes"])
    assert.ok(paths.has(path), path);
  assert.equal(resolveRoute("/collections/ads").status, 404);
  assert.equal(resolveRoute("/apps/not-an-app").status, 404);
  const unused = ["acrobat-distiller", "chrome"].find((id) => !publishedDocks.some((dock) => dock.apps.includes(id)))!;
  assert.equal(resolveRoute(`/apps/${unused}`).status, 404);
  assert.equal(paths.has(`/apps/${unused}`), false);
});

test("sitemap lists published Docks only", () => {
  const xml = sitemap();
  for (const dock of allDocks)
    assert.equal(xml.includes(`/docks/${dock.id}<`), dock.status === "published", dock.id);
});
