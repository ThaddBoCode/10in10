import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const settings = await prisma.privacySettings.findUnique({ where: { userId } });
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { weightVisible, caloriesVisible, activitiesVisible } = await request.json();

  const settings = await prisma.privacySettings.upsert({
    where: { userId },
    create: { userId, weightVisible, caloriesVisible, activitiesVisible },
    update: { weightVisible, caloriesVisible, activitiesVisible },
  });

  return NextResponse.json({ settings });
}
