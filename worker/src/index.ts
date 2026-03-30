export interface Env {
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  APP_URL: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Step 1: Redirect user to Strava OAuth
    if (url.pathname === "/auth") {
      const state = url.searchParams.get("state") || "";
      const stravaUrl = `https://www.strava.com/oauth/authorize?client_id=${env.STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(url.origin + "/callback")}&response_type=code&scope=read,activity:read_all&state=${state}`;
      return Response.redirect(stravaUrl, 302);
    }

    // Step 2: Handle Strava callback, exchange code for tokens
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") || "";

      if (!code) {
        return Response.redirect(`${env.APP_URL}/#/profile?strava=error`, 302);
      }

      const tokenRes = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: env.STRAVA_CLIENT_ID,
          client_secret: env.STRAVA_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        return Response.redirect(`${env.APP_URL}/#/profile?strava=error`, 302);
      }

      const data = await tokenRes.json() as Record<string, unknown>;

      // Redirect back to app with tokens in URL hash (not query params for security)
      const params = new URLSearchParams({
        access_token: data.access_token as string,
        refresh_token: data.refresh_token as string,
        expires_at: String(data.expires_at),
        athlete_id: String((data.athlete as Record<string, unknown>)?.id || ""),
        state,
      });

      return Response.redirect(`${env.APP_URL}/#/profile?strava=connected&${params}`, 302);
    }

    // Step 3: Refresh token endpoint (called from client)
    if (url.pathname === "/refresh" && request.method === "POST") {
      const body = await request.json() as Record<string, string>;
      const refreshToken = body.refresh_token;

      if (!refreshToken) {
        return new Response(JSON.stringify({ error: "refresh_token required" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const tokenRes = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: env.STRAVA_CLIENT_ID,
          client_secret: env.STRAVA_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const data = await tokenRes.json();

      return new Response(JSON.stringify(data), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Step 4: Proxy for fetching activities (avoids CORS issues)
    if (url.pathname === "/activities" && request.method === "POST") {
      const body = await request.json() as Record<string, string>;
      const accessToken = body.access_token;
      const after = body.after || "";

      const params = new URLSearchParams({ per_page: "50" });
      if (after) params.set("after", after);

      const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();

      return new Response(JSON.stringify(data), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response("10in10 Strava OAuth Worker", {
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  },
};
