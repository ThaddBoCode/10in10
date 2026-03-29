import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeStravaCode } from "@/lib/strava";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(new URL("/profile?strava=error", request.url));
  }

  try {
    const data = await exchangeStravaCode(code);

    await prisma.stravaConnection.upsert({
      where: { userId },
      create: {
        userId,
        stravaUserId: String(data.athlete.id),
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * 1000),
      },
      update: {
        stravaUserId: String(data.athlete.id),
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * 1000),
      },
    });

    return NextResponse.redirect(new URL("/profile?strava=connected", request.url));
  } catch {
    return NextResponse.redirect(new URL("/profile?strava=error", request.url));
  }
}
