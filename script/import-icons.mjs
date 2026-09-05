import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const input = process.argv[2];
if (!input)
  throw new Error("Usage: npm run import:icons -- /path/to/App-Icons");
const root = path.resolve(import.meta.dirname, "..");
const sources = JSON.parse(
  await readFile(path.join(root, "script/icon-sources.json"), "utf8"),
);
await mkdir(path.join(root, "public/app-icons/curated"), { recursive: true });
const catalog = [],
  provenance = [];
for (const app of sources) {
  if (
    !/^[a-z0-9-]{1,40}$/.test(app.id) ||
    path.basename(app.source) !== app.source
  )
    throw new Error("Invalid icon mapping");
  const bytes = await readFile(path.join(input, app.source));
  const metadata = await sharp(bytes).metadata();
  if (
    metadata.format !== "png" ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > 4096 ||
    metadata.height > 4096
  )
    throw new Error(`Invalid PNG: ${app.source}`);
  const icon = `/app-icons/curated/${app.id}.webp`;
  await sharp(bytes)
    .rotate()
    .resize(192, 192, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(path.join(root, "public", icon));
  catalog.push({ id: app.id, name: app.name, category: app.category, icon });
  provenance.push({
    id: app.id,
    source: app.source,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
  });
}
await writeFile(
  path.join(root, "src/lib/catalog.json"),
  JSON.stringify(catalog, null, 2) + "\n",
);
await writeFile(
  path.join(root, "docs/icon-provenance.json"),
  JSON.stringify(provenance, null, 2) + "\n",
);
console.log(
  `Imported ${catalog.length} supplied icons as 192px WebP assets. Originals were not changed.`,
);
