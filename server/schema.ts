import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";

export const requests = pgTable(
  "app_requests",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    website: text().notNull(),
    matchKey: text("match_key").notNull().unique(),
    notes: text().notNull().default(""),
    status: text().notNull().default("pending"),
    mergedInto: uuid("merged_into"),
    revision: integer().notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("requests_status_created").on(t.status, t.createdAt),
    check(
      "request_status",
      sql`${t.status} in ('pending','open','included','declined','merged')`,
    ),
    check("request_name_length", sql`length(${t.name}) between 1 and 80`),
    check(
      "request_website_length",
      sql`length(${t.website}) between 1 and 500`,
    ),
    check("request_notes_length", sql`length(${t.notes}) <= 1000`),
  ],
);

export const icons = pgTable(
  "icon_submissions",
  {
    id: text().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id),
    path: text().notNull().unique(),
    source: text().notNull(),
    notes: text().notNull().default(""),
    width: integer().notNull(),
    status: text().notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("icons_request").on(t.requestId),
    check("icon_status", sql`${t.status} in ('pending','approved','declined')`),
  ],
);

export const votes = pgTable(
  "app_votes",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id),
    userId: text("user_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.requestId, t.userId] }),
    index("votes_user").on(t.userId),
  ],
);

export const publishedApps = pgTable("published_apps", {
  id: text().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .unique()
    .references(() => requests.id),
  name: text().notNull(),
  category: text().notNull(),
  website: text().notNull(),
  iconPath: text("icon_path").notNull(),
  iconVersion: text("icon_version").notNull(),
  active: boolean().notNull().default(true),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const writeLimits = pgTable("write_limits", {
  key: text().primaryKey(),
  count: integer().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
