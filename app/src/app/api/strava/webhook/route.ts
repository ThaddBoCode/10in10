import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || "10in10-verify";

// Strava webhook validation (GET)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Strava webhook events (POST)
export async function POST(request: Request) {
  const body = await request.json();

  // Log the event for now - in production, trigger sync for the user
  console.log("Strava webhook event:", body);

  // body contains: object_type, object_id, aspect_type, owner_id, subscription_id
  // We could trigger a sync for the user here based on owner_id

  return NextResponse.json({ ok: true });
}
