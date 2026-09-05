import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema.js";

export function connectionString(value: string) {
  const url = new URL(value);
  url.searchParams.set("sslmode", "verify-full");
  return url.href;
}

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDatabase() {
  if (!database) {
    if (!process.env.DATABASE_URL)
      throw new Error("Database is not configured");
    const pool = new pg.Pool({
      connectionString: connectionString(process.env.DATABASE_URL),
      max: 3,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 5_000,
      statement_timeout: 10_000,
    });
    pool.on("error", () => console.error("Database connection unavailable"));
    if (process.env.VERCEL) attachDatabasePool(pool);
    database = drizzle(pool, { schema });
  }
  return database;
}
