/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
// createClient no longer needed - PrismaLibSQL takes config directly in v6

const globalForPrisma = globalThis as unknown as { prisma: any };

function createPrisma() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    const httpUrl = tursoUrl.trim().replace("libsql://", "https://");
    const adapter = new PrismaLibSQL({ url: httpUrl, authToken: tursoToken.trim() });
    return new PrismaClient({ adapter } as any);
  }

  // Dev: better-sqlite3
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const path = require("path");
  const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter } as any);
}

let _instance: any = null;
export const prisma: any = new Proxy({} as any, {
  get(_, prop) {
    if (!_instance) {
      _instance = globalForPrisma.prisma || createPrisma();
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _instance;
    }
    return _instance[prop];
  },
});
