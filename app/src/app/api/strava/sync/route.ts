import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  getStravaActivities,
  refreshStravaToken,
  mapStravaType,
  stravaCalories,
} from "@/lib/strava";

export async function POST() {
  const userId = await getSession();
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const connection = await prisma.stravaConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    return NextResponse.json({ error: "Strava nicht verbunden" }, { status: 400 });
  }

  // Refresh token if expired
  let accessToken = connection.accessToken;
  if (new Date() >= connection.expiresAt) {
    const refreshed = await refreshStravaToken(connection.refreshToken);
    accessToken = refreshed.access_token;
    await prisma.stravaConnection.update({
      where: { userId },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: new Date(refreshed.expires_at * 1000),
      },
    });
  }

  // Get last synced activity date
  const lastActivity = await prisma.activity.findFirst({
    where: { userId, source: "strava" },
    orderBy: { date: "desc" },
  });

  const after = lastActivity
    ? Math.floor(new Date(lastActivity.date).getTime() / 1000)
    : undefined;

  const stravaActivities = await getStravaActivities(accessToken, after);

  let synced = 0;
  for (const sa of stravaActivities) {
    const existing = await prisma.activity.findFirst({
      where: { userId, stravaId: String(sa.id) },
    });
    if (existing) continue;

    await prisma.activity.create({
      data: {
        userId,
        stravaId: String(sa.id),
        type: mapStravaType(sa.type),
        name: sa.name,
        date: new Date(sa.start_date),
        duration: sa.moving_time,
        distance: sa.distance,
        calories: stravaCalories(sa),
        avgHeartRate: sa.average_heartrate
          ? Math.round(sa.average_heartrate)
          : null,
        pace: sa.average_speed || null,
        source: "strava",
      },
    });
    synced++;
  }

  return NextResponse.json({ synced, total: stravaActivities.length });
}
