import { Pool, neonConfig, types } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Fix: Parse 'timestamp without time zone' (OID 1114) as UTC.
// The server sets process.env.TZ = 'America/Sao_Paulo', which causes the pg driver
// to mis-interpret UTC timestamps stored in the DB as if they were Brazil local time,
// adding an extra +3h offset. Treating them as UTC here corrects the chain:
// DB 15:09 UTC → JS Date 15:09 UTC → JSON "...T15:09:00Z" → Browser BRT: 12:09 ✓
types.setTypeParser(1114, (str: string) => new Date(str + 'Z'));

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
