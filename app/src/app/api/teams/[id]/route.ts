import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Get team details with members and their progress
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              privacySettings: true,
            },
          },
        },
      },
      createdBy: { select: { name: true } },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Team nicht gefunden" }, { status: 404 });
  }

  // Check membership
  const isMember = team.members.some((m: { userId: string }) => m.userId === userId);
  if (!isMember) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  // Get weight data for each member
  const memberProgress = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    team.members.map(async (member: any) => {
      const privacy = member.user.privacySettings;
      const isMe = member.userId === userId;
      const showWeight = isMe || privacy?.weightVisible !== false;
      const showCalories = isMe || privacy?.caloriesVisible !== false;
      const showActivities = isMe || privacy?.activitiesVisible !== false;

      // Get first and latest weight entry within team period
      const firstEntry = await prisma.weightEntry.findFirst({
        where: {
          userId: member.userId,
          date: { gte: team.startDate.toISOString().split("T")[0] },
          isLowest: true,
        },
        orderBy: { date: "asc" },
      });

      const latestEntry = await prisma.weightEntry.findFirst({
        where: { userId: member.userId, isLowest: true },
        orderBy: { date: "desc" },
      });

      const weightLoss = firstEntry && latestEntry
        ? Math.round((firstEntry.weight - latestEntry.weight) * 10) / 10
        : 0;

      // Get activity count in team period
      const activityCount = await prisma.activity.count({
        where: {
          userId: member.userId,
          date: { gte: team.startDate },
        },
      });

      // Get total training calories
      const activities = await prisma.activity.findMany({
        where: {
          userId: member.userId,
          date: { gte: team.startDate },
        },
        select: { calories: true },
      });
      const totalCalories = activities.reduce((s: number, a: { calories: number }) => s + a.calories, 0);

      return {
        userId: member.userId,
        name: member.user.name,
        role: member.role,
        isMe,
        weightLoss: showWeight ? weightLoss : null,
        currentWeight: showWeight && latestEntry ? latestEntry.weight : null,
        activityCount: showActivities ? activityCount : null,
        totalCalories: showCalories ? totalCalories : null,
        privacyLevel: showWeight ? "open" : "private",
      };
    })
  );

  type MP = { weightLoss: number | null; totalCalories: number | null; [key: string]: unknown };

  // Sort by weight loss (descending)
  memberProgress.sort((a: MP, b: MP) => (b.weightLoss || 0) - (a.weightLoss || 0));

  // Calculate team totals
  const teamTotalLoss = memberProgress.reduce((s: number, m: MP) => s + (m.weightLoss || 0), 0);
  const teamTotalCalories = memberProgress.reduce((s: number, m: MP) => s + (m.totalCalories || 0), 0);

  return NextResponse.json({
    team: {
      ...team,
      members: undefined, // Don't leak raw member data
    },
    members: memberProgress,
    teamTotalLoss: Math.round(teamTotalLoss * 10) / 10,
    teamTotalCalories,
    progressPct: team.targetKg > 0 ? Math.min((teamTotalLoss / team.targetKg) * 100, 100) : 0,
  });
}
