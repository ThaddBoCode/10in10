import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { weight } = await request.json();
  if (!weight || weight < 20 || weight > 300) {
    return NextResponse.json({ error: "Ungültiges Gewicht" }, { status: 400 });
  }

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].slice(0, 5);

  const entry = await prisma.weightEntry.create({
    data: { userId, weight, date, time },
  });

  // Recalculate isLowest for today
  const todayEntries = await prisma.weightEntry.findMany({
    where: { userId, date },
    orderBy: { weight: "asc" },
  });

  // Reset all, then mark lowest
  await prisma.weightEntry.updateMany({
    where: { userId, date },
    data: { isLowest: false },
  });

  if (todayEntries.length > 0) {
    await prisma.weightEntry.update({
      where: { id: todayEntries[0].id },
      data: { isLowest: true },
    });
  }

  return NextResponse.json({ entry });
}

export async function GET(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  // Get lowest entry per day
  const entries = await prisma.weightEntry.findMany({
    where: { userId, date: { gte: sinceStr }, isLowest: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ entries });
}
