const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || "";
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || "";
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || "";

export function getStravaAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: "code",
    scope: "read,activity:read_all",
    state: userId,
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export async function exchangeStravaCode(code: string) {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Strava token exchange failed");
  return res.json();
}

export async function refreshStravaToken(refreshToken: string) {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Strava token refresh failed");
  return res.json();
}

export async function getStravaActivities(
  accessToken: string,
  after?: number
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({ per_page: "50" });
  if (after) params.set("after", String(after));

  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("Strava activities fetch failed");
  return res.json();
}

export type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  moving_time: number;
  distance: number;
  kilojoules?: number;
  average_heartrate?: number;
  average_speed?: number;
};

export function mapStravaType(type: string): string {
  const map: Record<string, string> = {
    Run: "run",
    Ride: "ride",
    Swim: "swim",
    Walk: "hike",
    Hike: "hike",
    WeightTraining: "strength",
    Yoga: "yoga",
    Workout: "strength",
  };
  return map[type] || "other";
}

export function stravaCalories(activity: StravaActivity): number {
  // Strava provides kilojoules for rides, estimate for others
  if (activity.kilojoules) {
    return Math.round(activity.kilojoules); // kJ ≈ kcal for cycling
  }
  // Rough estimate: ~60-80 kcal per 10 min for moderate activity
  return Math.round((activity.moving_time / 60) * 7);
}
