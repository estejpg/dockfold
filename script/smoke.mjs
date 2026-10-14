// Post-deploy check: node script/smoke.mjs https://dockfold.vercel.app
const base = process.argv[2]?.replace(/\/$/, "");
if (!base || !/^https?:\/\//.test(base))
  throw new Error("Usage: npm run smoke -- https://your-deployment.example");

const checks = [
  { path: "/", status: 200, contains: 'data-route="/"' },
  { path: "/latest", status: 200, contains: 'data-route="/latest"' },
  { path: "/submit", status: 200 },
  { path: "/docks/cursor-desk", status: 200, contains: "<link rel=\"canonical\"" },
  { path: "/docks/not-a-real-dock", status: 404 },
  { path: "/dock", status: 200 },
  { path: "/sitemap.xml", status: 200, contains: "<urlset" },
  { path: "/api/suggest", status: 405 },
];

let failed = 0;
for (const check of checks) {
  const response = await fetch(base + check.path, { redirect: "manual" });
  const body = await response.text();
  const ok =
    response.status === check.status &&
    (!check.contains || body.includes(check.contains));
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${check.path} → ${response.status} (expected ${check.status})`,
  );
}
if (failed) process.exit(1);
