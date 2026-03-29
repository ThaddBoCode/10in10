"use client";

import { useAuth } from "@/components/AuthGuard";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { LogOut, Palette, Link2, Link2Off, RefreshCw, Check } from "lucide-react";

const themes = [
  { id: "glass", label: "Glass" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "brutal", label: "Brutal" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaLoading, setStravaLoading] = useState(false);

  useEffect(() => {
    // Check if Strava is connected by trying to fetch connection
    fetch("/api/strava/connect")
      .then((r) => r.json())
      .then((d) => setStravaConnected(!!d.url))
      .catch(() => {});

    // Check URL params for Strava callback result
    const params = new URLSearchParams(window.location.search);
    if (params.get("strava") === "connected") {
      setStravaConnected(true);
    }
  }, []);

  const handleStravaConnect = async () => {
    setStravaLoading(true);
    const res = await fetch("/api/strava/connect");
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    setStravaLoading(false);
  };

  const handleStravaDisconnect = async () => {
    await fetch("/api/strava/disconnect", { method: "POST" });
    setStravaConnected(false);
  };

  return (
    <div className="pt-6">
      {/* Header */}
      <div className="flex flex-col items-center px-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
             style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
          {user?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <h1 className="font-heading mt-3 text-[22px]" style={{ color: "var(--text)" }}>{user?.name}</h1>
      </div>

      {/* Strava Connection */}
      <div className="mx-5 mt-8">
        <p className="font-body mb-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Verbindungen
        </p>
        <div className="overflow-hidden rounded-[14px]" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3.5 p-4" style={{ background: "var(--bg-card)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
            </svg>
            <div className="flex-1">
              <p className="font-body text-[15px] font-medium" style={{ color: "var(--text)" }}>Strava</p>
              {stravaConnected ? (
                <p className="font-body text-xs" style={{ color: "var(--success)" }}>Verbunden</p>
              ) : (
                <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>Nicht verbunden</p>
              )}
            </div>
            {stravaConnected ? (
              <button onClick={handleStravaDisconnect}
                className="font-body flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "var(--danger)" }}>
                <Link2Off size={14} /> Trennen
              </button>
            ) : (
              <button onClick={handleStravaConnect} disabled={stravaLoading}
                className="font-body flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: "#FC4C02" }}>
                {stravaLoading ? <RefreshCw size={14} className="animate-spin" /> : <Link2 size={14} />}
                Verbinden
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Theme selector */}
      <div className="mx-5 mt-6">
        <p className="font-body mb-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Darstellung
        </p>
        <div className="overflow-hidden rounded-[14px]" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3.5 p-4" style={{ background: "var(--bg-card)" }}>
            <Palette size={20} style={{ color: "var(--primary-light)" }} />
            <div className="flex-1">
              <p className="font-body text-[15px] font-medium" style={{ color: "var(--text)" }}>Theme</p>
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                {themes.map((t) => (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className="font-body rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: theme === t.id ? "var(--primary)" : "var(--bg-input, var(--bg))",
                      color: theme === t.id ? "white" : "var(--text-secondary)",
                      border: `1px solid ${theme === t.id ? "var(--primary)" : "var(--border)"}`,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mx-5 mt-6">
        <p className="font-body mb-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Konto
        </p>
        <button onClick={logout}
          className="flex w-full items-center gap-3.5 rounded-[14px] p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <LogOut size={20} style={{ color: "var(--danger)" }} />
          <span className="font-body text-[15px] font-medium" style={{ color: "var(--danger)" }}>Abmelden</span>
        </button>
      </div>
    </div>
  );
}
