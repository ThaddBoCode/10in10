import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

const WORKER_URL = "https://strava-oauth.singaporedigitalbusiness.workers.dev";

// Start OAuth flow - redirects to Strava
export function startStravaAuth(userId: string) {
  window.location.href = `${WORKER_URL}/auth?state=${userId}`;
}

// Save Strava tokens after OAuth callback
export async function saveStravaTokens(userId: string, params: URLSearchParams) {
  await setDoc(doc(db, "users", userId, "settings", "strava"), {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    expiresAt: parseInt(params.get("expires_at") || "0"),
    athleteId: params.get("athlete_id"),
    connectedAt: new Date().toISOString(),
  });
}

// Check if Strava is connected
export async function isStravaConnected(userId: string): Promise<boolean> {
  const d = await getDoc(doc(db, "users", userId, "settings", "strava"));
  return d.exists() && !!d.data().accessToken;
}

// Disconnect Strava
export async function disconnectStrava(userId: string) {
  await deleteDoc(doc(db, "users", userId, "settings", "strava"));
}

// Get valid access token (refreshes if expired)
async function getAccessToken(userId: string): Promise<string | null> {
  const d = await getDoc(doc(db, "users", userId, "settings", "strava"));
  if (!d.exists()) return null;

  const data = d.data();
  const now = Math.floor(Date.now() / 1000);

  if (data.expiresAt > now + 60) {
    return data.accessToken;
  }

  // Refresh token
  const res = await fetch(`${WORKER_URL}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: data.refreshToken }),
  });

  if (!res.ok) return null;
  const refreshed = await res.json() as Record<string, unknown>;

  await setDoc(doc(db, "users", userId, "settings", "strava"), {
    ...data,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: refreshed.expires_at,
  });

  return refreshed.access_token as string;
}

// Sync activities from Strava
export async function syncStravaActivities(userId: string) {
  const token = await getAccessToken(userId);
  if (!token) throw new Error("Nicht mit Strava verbunden");

  const res = await fetch(`${WORKER_URL}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: token }),
  });

  if (!res.ok) throw new Error("Strava-Sync fehlgeschlagen");

  const activities = await res.json() as StravaActivity[];
  return activities;
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
    Run: "run", Ride: "ride", Swim: "swim", Walk: "hike",
    Hike: "hike", WeightTraining: "strength", Yoga: "yoga", Workout: "strength",
  };
  return map[type] || "other";
}

export function stravaCalories(activity: StravaActivity): number {
  if (activity.kilojoules) return Math.round(activity.kilojoules);
  return Math.round((activity.moving_time / 60) * 7);
}
