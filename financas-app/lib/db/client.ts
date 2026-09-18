// client.ts
// Turso (libSQL) em produção; sem TURSO_DATABASE_URL, cai para um arquivo
// sqlite local (./local.db) — bom o bastante para rodar `npm run dev` sem
// precisar de conta Turso configurada.

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
