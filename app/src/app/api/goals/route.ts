import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { startWeight, targetWeight, weeks } = await request.json();

  if (!startWeight || !targetWeight || !weeks) {
    return NextResponse.json({ error: "Alle Felder sind erforderlich" }, { status: 400 });
  }

  // Deactivate existing goals
  await prisma.goal.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + weeks * 7);

  const goal = await prisma.goal.create({
    data: {
      userId,
      startWeight,
      targetWeight,
      startDate,
      endDate,
      weeks,
    },
  });

  // Also save the start weight as first entry
  const date = startDate.toISOString().split("T")[0];
  const time = startDate.toTimeString().split(" ")[0].slice(0, 5);

  await prisma.weightEntry.create({
    data: { userId, weight: startWeight, date, time, isLowest: true },
  });

  return NextResponse.json({ goal });
}

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const goal = await prisma.goal.findFirst({
    where: { userId, isActive: true },
  });

  return NextResponse.json({ goal });
}
