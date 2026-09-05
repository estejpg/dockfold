import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connectionString } from "../server/database.js";

if (!process.env.DATABASE_URL_UNPOOLED)
  throw new Error("Set DATABASE_URL_UNPOOLED for the intended environment.");
const pool = new pg.Pool({
  connectionString: connectionString(process.env.DATABASE_URL_UNPOOLED),
});
try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("DockFold database migrations applied.");
} finally {
  await pool.end();
}
