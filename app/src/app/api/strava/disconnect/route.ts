import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  const userId = await getSession();
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  await prisma.stravaConnection.deleteMany({ where: { userId } });

  return NextResponse.json({ ok: true });
}
