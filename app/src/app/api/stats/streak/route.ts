import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  // Get all unique dates with weight entries, sorted descending
  const entries = await prisma.weightEntry.findMany({
    where: { userId },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
  });

  const dates = entries.map((e) => e.date);

  // Calculate streak: count consecutive days from today backwards
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (dates.includes(dateStr)) {
      streak++;
    } else if (i === 0) {
      // Today hasn't been logged yet, that's ok - check from yesterday
      continue;
    } else {
      break;
    }
  }

  // Get this week's days (Mo-So) with logged status
  const weekDays = [];
  const mondayOffset = (today.getDay() + 6) % 7; // Days since Monday
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - mondayOffset + i);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = dateStr === today.toISOString().split("T")[0];
    const isFuture = d > today;
    const logged = dates.includes(dateStr);

    weekDays.push({
      label: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][i],
      date: dateStr,
      logged,
      isToday,
      isFuture,
    });
  }

  return NextResponse.json({ streak, weekDays, totalEntries: dates.length });
}
