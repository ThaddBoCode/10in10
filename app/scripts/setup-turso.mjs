import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const url = process.argv[2];
const token = process.argv[3];

if (!url || !token) {
  console.error("Usage: node scripts/setup-turso.mjs <TURSO_URL> <TURSO_TOKEN>");
  process.exit(1);
}

const client = createClient({ url, authToken: token });

const sql = readFileSync("prisma/migrations/20260329090213_init/migration.sql", "utf8");

// Split by semicolons and execute each statement
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Executing ${statements.length} statements on Turso...`);

for (const stmt of statements) {
  try {
    await client.execute(stmt);
    const preview = stmt.slice(0, 60).replace(/\n/g, " ");
    console.log(`  OK: ${preview}...`);
  } catch (err) {
    // Ignore "already exists" errors
    if (err.message?.includes("already exists")) {
      console.log(`  SKIP (exists): ${stmt.slice(0, 50)}...`);
    } else {
      console.error(`  ERROR: ${err.message}`);
      console.error(`  Statement: ${stmt.slice(0, 80)}...`);
    }
  }
}

console.log("\nDone! Turso database schema is ready.");
