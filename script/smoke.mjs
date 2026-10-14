// Post-deploy check: node script/smoke.mjs https://dockfold.vercel.app
const base = process.argv[2]?.replace(/\/$/, "");
if (!base || !/^https?:\/\//.test(base))
  throw new Error("Usage: npm run smoke -- https://your-deployment.example");

const checks = [
  { path: "/", status: 200 },
  { path: "/api/suggest", status: 405 },
];

let failed = 0;
for (const check of checks) {
  const response = await fetch(base + check.path, { redirect: "manual" });
  const ok = response.status === check.status;
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${check.path} → ${response.status} (expected ${check.status})`,
  );
}
if (failed) process.exit(1);
