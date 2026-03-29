import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const activities = await prisma.activity.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { type, name, duration, calories, distance } = await request.json();

  if (!type || !name || !duration) {
    return NextResponse.json({ error: "Typ, Name und Dauer sind erforderlich" }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      userId,
      type,
      name,
      date: new Date(),
      duration: duration * 60, // minutes to seconds
      distance: distance || null,
      calories: calories || Math.round((duration / 10) * 70), // rough estimate
      source: "manual",
    },
  });

  return NextResponse.json({ activity });
}
