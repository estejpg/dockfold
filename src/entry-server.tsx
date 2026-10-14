import { prerender } from "react-dom/static";
import { App, clientShellPaths, resolveRoute, staticPaths } from "./app";
import { allDocks } from "./lib/docks";
import { SITE } from "./lib/site";

export { clientShellPaths, staticPaths };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function renderPage(
  path: string,
  template: string,
  mode: "static" | "shell" = "static",
) {
  const match = resolveRoute(path);
  let body = "";
  if (mode === "static") {
    const { prelude } = await prerender(<App match={match} />);
    body = await new Response(prelude).text();
  }
  const head = [
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(match.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(match.description)}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ];
  if (match.canonical) {
    const url = SITE.url + (match.canonical === "/" ? "/" : match.canonical);
    head.push(`<link rel="canonical" href="${escapeHtml(url)}" />`);
    head.push(`<meta property="og:url" content="${escapeHtml(url)}" />`);
  }
  if (match.noindex || match.status !== 200 || mode === "shell")
    head.push(`<meta name="robots" content="noindex" />`);
  if (match.jsonLd && mode === "static")
    head.push(
      `<script type="application/ld+json">${JSON.stringify(match.jsonLd).replaceAll("<", "\\u003c")}</script>`,
    );
  const routeAttribute = mode === "static" ? ` data-route="${escapeHtml(match.key)}"` : "";
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(match.title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta name="description" content="${escapeHtml(match.description)}" />`,
    )
    .replace("</head>", `    ${head.join("\n    ")}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"${routeAttribute}>${body}</div>`);
  return { html, status: match.status, match };
}

export function sitemap() {
  const pages = ["/", "/latest", "/submit", "/privacy"].map((path) => ({ path, lastmod: "" }));
  for (const dock of allDocks)
    if (dock.status === "published")
      pages.push({ path: `/docks/${dock.id}`, lastmod: dock.updatedOn ?? dock.addedOn });
  const urls = pages
    .map(
      ({ path, lastmod }) =>
        `  <url><loc>${escapeHtml(SITE.url + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
