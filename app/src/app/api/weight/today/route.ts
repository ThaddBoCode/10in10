import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const date = new Date().toISOString().split("T")[0];

  const entries = await prisma.weightEntry.findMany({
    where: { userId, date },
    orderBy: { time: "asc" },
  });

  return NextResponse.json({ entries });
}
