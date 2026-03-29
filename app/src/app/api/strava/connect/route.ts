import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStravaAuthUrl } from "@/lib/strava";

export async function GET() {
  const userId = await getSession();
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const url = getStravaAuthUrl(userId);
  return NextResponse.json({ url });
}
