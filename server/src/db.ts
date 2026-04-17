import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@deenyai/shared";

let _db: NodePgDatabase<typeof schema> | null = null;
let _connectionString: string | undefined;
let _isWorker = false;

// Called per-request in worker.ts middleware to inject Hyperdrive connection string.
// Always resets _db so each Worker request gets a fresh pool —
// Hyperdrive handles the actual DB connection pooling on its side.
export function initDb(connectionString: string) {
  _connectionString = connectionString;
  _isWorker = true;
  _db = null;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (_isWorker || !_db) {
    const connectionString = _connectionString || process.env.DATABASE_URL;
    const isLocal =
      (connectionString ?? "").includes("localhost") ||
      (connectionString ?? "").includes("127.0.0.1");
    const pool = new pg.Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
    });
    const instance = drizzle(pool, { schema });
    if (!_isWorker) _db = instance; // cache only for local dev
    return instance;
  }
  return _db;
}

// Backward-compatible lazy proxy — storage.ts uses this directly
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
