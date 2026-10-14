// Writes one HTML file per route into dist/ after the client and SSR builds.
// Vercel serves them with cleanUrls (/latest → latest.html) and 404.html for misses.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const ssr = path.join(root, "dist-ssr");
const { renderPage, sitemap, staticPaths, clientShellPaths } = await import(
  pathToFileURL(path.join(ssr, "entry-server.js")).href
);
const template = await readFile(path.join(dist, "index.html"), "utf8");
if (!template.includes('<div id="root"></div>'))
  throw new Error("dist/index.html is missing the empty root element");

function fileFor(route) {
  return route === "/" ? "index.html" : `${route.slice(1)}.html`;
}
async function write(route, html) {
  const file = path.join(dist, fileFor(route));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

let count = 0;
for (const route of staticPaths()) {
  const { html, status } = await renderPage(route, template);
  if (status !== 200) throw new Error(`${route} rendered with status ${status}`);
  await write(route, html);
  count++;
}
for (const route of clientShellPaths) {
  await write(route, (await renderPage(route, template, "shell")).html);
  count++;
}
const missing = await renderPage("/404", template);
if (missing.status !== 404) throw new Error("The 404 page must render with status 404");
await write("/404", missing.html);
await writeFile(path.join(dist, "sitemap.xml"), sitemap());
await rm(ssr, { recursive: true, force: true });
console.log(`Prerendered ${count + 1} pages and sitemap.xml.`);
