import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@deenyai/shared";

let _db: NodePgDatabase<typeof schema> | null = null;

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    const isLocal = (process.env.DATABASE_URL ?? "").includes("localhost") ||
                    (process.env.DATABASE_URL ?? "").includes("127.0.0.1");
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

// For backward compat — lazy getter
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
