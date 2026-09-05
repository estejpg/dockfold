import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "../server/database.js";
import { publishedApps } from "../server/schema.js";
export default {
  async fetch(request: Request) {
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response(null, {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    try {
      const url = new URL(request.url),
        id = url.searchParams.get("id") || "",
        version = url.searchParams.get("v") || "";
      if (
        !/^community-[a-f0-9-]{36}$/.test(id) ||
        !/^[a-f0-9]{64}$/.test(version)
      )
        return new Response(null, { status: 404 });
      const [row] = await getDatabase()
        .select({ path: publishedApps.iconPath })
        .from(publishedApps)
        .where(
          and(eq(publishedApps.id, id), eq(publishedApps.iconVersion, version)),
        );
      if (!row) return new Response(null, { status: 404 });
      const file = await get(row.path, {
        storeId: process.env.ICON_INBOX_STORE_ID,
        access: "private",
      });
      if (!file || file.statusCode !== 200)
        return new Response(null, { status: 404 });
      return new Response(request.method === "HEAD" ? null : file.stream, {
        headers: {
          "Content-Type": "image/webp",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=86400, immutable",
          "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return new Response(null, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
  },
};
