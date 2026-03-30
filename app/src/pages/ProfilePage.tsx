import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useTheme } from "../components/ThemeProvider";
import { useSearchParams } from "react-router-dom";
import { LogOut, Palette, Link2, Link2Off } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { startStravaAuth, saveStravaTokens, isStravaConnected, disconnectStrava } from "../lib/strava";

const themes = [
  { id: "glass", label: "Glass" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "brutal", label: "Brutal" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stravaConnected, setStravaConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if returning from Strava OAuth
    const stravaStatus = searchParams.get("strava");
    if (stravaStatus === "connected" && searchParams.get("access_token")) {
      saveStravaTokens(user.uid, searchParams).then(() => {
        setStravaConnected(true);
        // Clean URL
        setSearchParams({});
      });
    } else {
      isStravaConnected(user.uid).then(setStravaConnected);
    }
  }, [user, searchParams, setSearchParams]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleStravaConnect = () => {
    if (user) startStravaAuth(user.uid);
  };

  const handleStravaDisconnect = async () => {
    if (user) {
      await disconnectStrava(user.uid);
      setStravaConnected(false);
    }
  };

  return (
    <div className="pt-6">
      <div className="flex flex-col items-center px-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
          {user?.displayName?.[0]?.toUpperCase() || "?"}
        </div>
        <h1 className="font-heading mt-3 text-[22px]" style={{ color: "var(--text)" }}>{user?.displayName}</h1>
      </div>

      {/* Strava */}
      <div className="mx-5 mt-8">
        <p className="font-body mb-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Verbindungen</p>
        <div className="overflow-hidden rounded-[14px]" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3.5 p-4" style={{ background: "var(--bg-card)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
            </svg>
            <div className="flex-1">
              <p className="font-body text-[15px] font-medium" style={{ color: "var(--text)" }}>Strava</p>
              <p className="font-body text-xs" style={{ color: stravaConnected ? "var(--success)" : "var(--text-secondary)" }}>
                {stravaConnected ? "Verbunden" : "Nicht verbunden"}
              </p>
            </div>
            {stravaConnected ? (
              <button onClick={handleStravaDisconnect}
                className="font-body flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "var(--danger)" }}>
                <Link2Off size={14} /> Trennen
              </button>
            ) : (
              <button onClick={handleStravaConnect}
                className="font-body flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: "#FC4C02" }}>
                <Link2 size={14} /> Verbinden
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="mx-5 mt-6">
        <p className="font-body mb-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Darstellung</p>
        <div className="overflow-hidden rounded-[14px]" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3.5 p-4" style={{ background: "var(--bg-card)" }}>
            <Palette size={20} style={{ color: "var(--primary-light)" }} />
            <div className="flex-1">
              <p className="font-body text-[15px] font-medium" style={{ color: "var(--text)" }}>Theme</p>
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                {themes.map((t) => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className="font-body rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ background: theme === t.id ? "var(--primary)" : "var(--bg-input, var(--bg))", color: theme === t.id ? "white" : "var(--text-secondary)", border: `1px solid ${theme === t.id ? "var(--primary)" : "var(--border)"}` }}>
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
        <p className="font-body mb-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Konto</p>
        <button onClick={handleLogout} className="flex w-full items-center gap-3.5 rounded-[14px] p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <LogOut size={20} style={{ color: "var(--danger)" }} />
          <span className="font-body text-[15px] font-medium" style={{ color: "var(--danger)" }}>Abmelden</span>
        </button>
      </div>
    </div>
  );
}
