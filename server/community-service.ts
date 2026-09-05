import { createHmac, createHash } from "node:crypto";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { get, put } from "@vercel/blob";
import sharp from "sharp";
import { getDatabase } from "./database.js";
import {
  requests,
  icons,
  votes,
  publishedApps,
  writeLimits,
} from "./schema.js";
import { HttpError, requestFields } from "./http.js";
import { APP_CATEGORIES } from "../src/lib/community.js";

type Transaction = Parameters<
  Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
>[0];
type RequestRow = typeof requests.$inferSelect;

// The database window is shared by all instances. Only a keyed digest is retained.
export async function limitWrites(request: Request, account?: string) {
  const db = getDatabase();
  const address =
    account ||
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    "local";
  const key = createHmac(
    "sha256",
    process.env.CLERK_SECRET_KEY || "local-development",
  )
    .update(`${account ? "vote" : "submit"}:${address}`)
    .digest("hex");
  const [row] = await db
    .insert(writeLimits)
    .values({ key, count: 1, expiresAt: sql`now() + interval '1 hour'` })
    .onConflictDoUpdate({
      target: writeLimits.key,
      set: {
        count: sql`case when ${writeLimits.expiresAt} < now() then 1 else ${writeLimits.count} + 1 end`,
        expiresAt: sql`case when ${writeLimits.expiresAt} < now() then now() + interval '1 hour' else ${writeLimits.expiresAt} end`,
      },
    })
    .returning({ count: writeLimits.count });
  if (row.count > (account ? 120 : 20))
    throw new HttpError(
      "Too many submissions. Please try again in an hour.",
      429,
    );
  await db
    .delete(writeLimits)
    .where(lt(writeLimits.expiresAt, sql`now() - interval '1 day'`));
}

async function findRequest(
  tx: Transaction,
  fields: ReturnType<typeof requestFields>,
) {
  let [row] = await tx
    .insert(requests)
    .values(fields)
    .onConflictDoUpdate({
      target: requests.matchKey,
      set: { matchKey: fields.matchKey },
    })
    .returning();
  // Follow merged requests under a row lock so a simultaneous contribution cannot be lost.
  for (let i = 0; row.status === "merged"; i++) {
    if (!row.mergedInto || i > 100)
      throw new Error("Invalid request merge chain");
    [row] = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, row.mergedInto))
      .for("update");
  }
  return row;
}

export async function addRequest(value: Record<string, unknown>) {
  const fields = requestFields(value);
  return getDatabase().transaction(async (tx) => {
    const row = await findRequest(tx, fields);
    // A repeat request keeps the new requester's private notes for review instead
    // of dropping them; the column stays within its 1000-character check.
    if (
      fields.notes &&
      row.notes !== fields.notes &&
      ["pending", "open"].includes(row.status)
    )
      await tx
        .update(requests)
        .set({
          notes: sql`left(case when ${requests.notes} = '' then ${fields.notes} else ${requests.notes} || ${"\n\n"} || ${fields.notes} end, 1000)`,
        })
        .where(eq(requests.id, row.id));
    // Pending and declined submissions remain private, including their identifiers.
    return {
      received: true,
      ...(["open", "included"].includes(row.status)
        ? { existing: row.id, existingName: row.name }
        : {}),
    };
  });
}

export type IconRecord = {
  appName: string;
  website: string;
  source: string;
  notes: string;
  width: number;
  height: number;
  receipt: string;
  digest: string;
  path: string;
};
export async function recordIcon(icon: IconRecord) {
  const fields = requestFields({
    name: icon.appName,
    website: icon.website,
    notes: "",
  });
  await getDatabase().transaction(async (tx) => {
    const row = await findRequest(tx, fields);
    await tx
      .insert(icons)
      .values({
        id: icon.digest,
        requestId: row.id,
        path: icon.path,
        source: icon.source,
        notes: icon.notes,
        width: icon.width,
      })
      .onConflictDoNothing({ target: icons.id });
  });
}

export async function listBoard(query: string, offset: number) {
  const db = getDatabase();
  const search = query.replace(/[\\%_]/g, "\\$&");
  const rows = await db
    .select({
      id: requests.id,
      name: requests.name,
      website: requests.website,
      status: requests.status,
      createdAt: requests.createdAt,
      votes: sql<number>`count(${votes.userId})::int`,
    })
    .from(requests)
    .leftJoin(votes, eq(votes.requestId, requests.id))
    .where(
      and(
        inArray(requests.status, ["open", "included"]),
        sql`${requests.name} ilike ${`%${search}%`}`,
      ),
    )
    .groupBy(requests.id)
    .orderBy(
      desc(sql`count(${votes.userId})`),
      asc(requests.createdAt),
      asc(requests.id),
    )
    .limit(51)
    .offset(offset);
  return { requests: rows.slice(0, 50), more: rows.length > 50 };
}

export async function ownVotes(userId: string) {
  return (
    await getDatabase()
      .select({ id: votes.requestId })
      .from(votes)
      .where(eq(votes.userId, userId))
      .limit(5000)
  ).map((row) => row.id);
}
export async function saveVote(id: string, userId: string, desired: boolean) {
  return getDatabase().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .for("update");
    if (!row || row.status !== "open")
      throw new HttpError(
        "This app is no longer open for voting. Refresh the list.",
        409,
      );
    if (desired)
      await tx
        .insert(votes)
        .values({ requestId: id, userId })
        .onConflictDoNothing();
    else
      await tx
        .delete(votes)
        .where(and(eq(votes.requestId, id), eq(votes.userId, userId)));
    const [count] = await tx
      .select({ value: sql<number>`count(*)::int` })
      .from(votes)
      .where(eq(votes.requestId, id));
    return { id, voted: desired, votes: count.value };
  });
}

export async function listCatalog() {
  const rows = await getDatabase()
    .select()
    .from(publishedApps)
    .orderBy(asc(publishedApps.id))
    .limit(5001);
  if (rows.length > 5000) throw new Error("Catalog exceeds supported size");
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    active: row.active,
    icon: `/api/catalog-icon?id=${row.id}&v=${row.iconVersion}`,
  }));
}
export async function listReview(status: string, offset: number) {
  const db = getDatabase();
  // Include unresolved icons for previously reviewed apps in the pending queue.
  const filter =
    status === "pending"
      ? sql`(${requests.status} = 'pending' or exists (select 1 from ${icons} where ${icons.requestId} = ${requests.id} and ${icons.status} = 'pending'))`
      : eq(requests.status, status);
  const rows = await db
    .select()
    .from(requests)
    .where(filter)
    .orderBy(asc(requests.createdAt), asc(requests.id))
    .limit(26)
    .offset(offset);
  const ids = rows.slice(0, 25).map((row) => row.id);
  const images = ids.length
    ? await db
        .select({
          id: icons.id,
          requestId: icons.requestId,
          source: icons.source,
          notes: icons.notes,
          width: icons.width,
          status: icons.status,
        })
        .from(icons)
        .where(inArray(icons.requestId, ids))
        .orderBy(asc(icons.createdAt))
        .limit(501)
    : [];
  if (images.length > 500)
    throw new HttpError(
      "This review page has too many images. Contact the maintainer.",
      503,
    );
  return {
    requests: rows
      .slice(0, 25)
      .map(({ id, name, website, notes, status, revision, createdAt }) => ({
        id,
        name,
        website,
        notes,
        status,
        revision,
        createdAt,
      })),
    icons: images,
    catalog: await listCatalog(),
    more: rows.length > 25,
  };
}

export async function listTargets(query: string) {
  const search = query.replace(/[\\%_]/g, "\\$&");
  return {
    requests: await getDatabase()
      .select({ id: requests.id, name: requests.name })
      .from(requests)
      .where(
        and(
          inArray(requests.status, ["pending", "open", "included"]),
          sql`${requests.name} ilike ${`%${search}%`}`,
        ),
      )
      .orderBy(asc(requests.name))
      .limit(50),
  };
}

function checkRevision(row: RequestRow | undefined, revision: unknown) {
  if (!row) throw new HttpError("The request was not found.", 404);
  if (row.revision !== revision || row.status === "merged")
    throw new HttpError(
      "This request changed during review. Refresh before trying again.",
      409,
    );
  return row;
}
export async function reviewStatus(
  id: string,
  revision: unknown,
  status: "open" | "declined",
) {
  return getDatabase().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .for("update");
    const row = checkRevision(current, revision);
    if (row.status === "included")
      throw new HttpError(
        "Use the catalog visibility control for an included app.",
        409,
      );
    await tx
      .update(requests)
      .set({ status, revision: row.revision + 1 })
      .where(eq(requests.id, id));
    if (status === "declined")
      await tx
        .update(icons)
        .set({ status: "declined" })
        .where(and(eq(icons.requestId, id), eq(icons.status, "pending")));
    return { saved: true };
  });
}

export async function mergeRequests(
  id: string,
  targetId: string,
  revision: unknown,
) {
  if (id === targetId) throw new HttpError("Choose a different request.");
  return getDatabase().transaction(async (tx) => {
    // Consistent locking order prevents opposing merge operations from deadlocking.
    const rows = await tx
      .select()
      .from(requests)
      .where(inArray(requests.id, [id, targetId]))
      .orderBy(asc(requests.id))
      .for("update");
    const source = checkRevision(
      rows.find((row) => row.id === id),
      revision,
    );
    const target = rows.find((row) => row.id === targetId);
    if (
      source.status === "included" ||
      !target ||
      !["pending", "open", "included"].includes(target.status)
    )
      throw new HttpError(
        "Choose an active target. Published apps cannot be merged away.",
        409,
      );
    await tx.execute(
      sql`insert into ${votes} (request_id, user_id) select ${targetId}::uuid, user_id from ${votes} where request_id = ${id}::uuid on conflict do nothing`,
    );
    await tx.delete(votes).where(eq(votes.requestId, id));
    await tx
      .update(icons)
      .set({ requestId: targetId })
      .where(eq(icons.requestId, id));
    await tx
      .update(requests)
      .set({
        status: "merged",
        mergedInto: targetId,
        revision: source.revision + 1,
      })
      .where(eq(requests.id, id));
    await tx
      .update(requests)
      .set({ revision: target.revision + 1 })
      .where(eq(requests.id, targetId));
    return { saved: true };
  });
}

export async function privateIcon(id: string) {
  const [row] = await getDatabase()
    .select()
    .from(icons)
    .where(eq(icons.id, id));
  if (!row) throw new HttpError("This icon was not found.", 404);
  const file = await get(row.path, {
    storeId: process.env.ICON_INBOX_STORE_ID,
    access: "private",
  });
  if (!file || file.statusCode !== 200)
    throw new HttpError(
      "The original icon is unavailable. Please try again.",
      503,
    );
  return file;
}
export async function declineIcon(id: string) {
  await getDatabase()
    .update(icons)
    .set({ status: "declined" })
    .where(and(eq(icons.id, id), eq(icons.status, "pending")));
  return { saved: true };
}

export async function publishIcon(
  id: string,
  iconId: string,
  revision: unknown,
  category: unknown,
) {
  if (!APP_CATEGORIES.some((value) => value === category))
    throw new HttpError("Choose an app category.");
  const db = getDatabase();
  // Reject stale reviews before the optimized image is generated and stored;
  // the locked check inside the transaction below remains authoritative.
  const [current] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, id));
  checkRevision(current, revision);
  const [candidate] = await db
    .select()
    .from(icons)
    .where(and(eq(icons.id, iconId), eq(icons.requestId, id)));
  if (!candidate || candidate.status === "declined")
    throw new HttpError("Choose an available icon for this app.");
  const original = await privateIcon(iconId);
  const bytes = Buffer.from(await new Response(original.stream).arrayBuffer());
  const optimized = await sharp(bytes, { limitInputPixels: 2048 ** 2 })
    .resize(192, 192)
    .webp({ quality: 90 })
    .toBuffer();
  const version = createHash("sha256").update(optimized).digest("hex");
  const appId = `community-${id}`;
  const prefix =
    process.env.VERCEL_ENV === "production" ? "published" : "preview/published";
  const path = `${prefix}/${appId}/${version}.webp`;
  await put(path, optimized, {
    access: "private",
    storeId: process.env.ICON_INBOX_STORE_ID,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/webp",
  });
  // Publish the DB record only after its complete optimized image exists.
  return getDatabase().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .for("update");
    const row = checkRevision(current, revision);
    const [image] = await tx
      .select()
      .from(icons)
      .where(and(eq(icons.id, iconId), eq(icons.requestId, id)))
      .for("update");
    if (!image || image.status === "declined")
      throw new HttpError(
        "The icon changed during review. Refresh before trying again.",
        409,
      );
    const values = {
      id: appId,
      requestId: id,
      name: row.name,
      website: row.website,
      category: String(category),
      iconPath: path,
      iconVersion: version,
      active: true,
    };
    await tx
      .insert(publishedApps)
      .values(values)
      .onConflictDoUpdate({ target: publishedApps.id, set: values });
    await tx
      .update(icons)
      .set({ status: "approved" })
      .where(eq(icons.id, iconId));
    await tx
      .update(requests)
      .set({ status: "included", revision: row.revision + 1 })
      .where(eq(requests.id, id));
    return { saved: true, appId };
  });
}
export async function setVisibility(id: string, active: boolean) {
  const rows = await getDatabase()
    .update(publishedApps)
    .set({ active })
    .where(eq(publishedApps.id, id))
    .returning({ id: publishedApps.id });
  if (!rows.length) throw new HttpError("The app was not found.", 404);
  return { saved: true };
}
