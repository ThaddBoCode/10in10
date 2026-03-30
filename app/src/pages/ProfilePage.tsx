import { useAuth } from "../components/AuthProvider";
import { useTheme } from "../components/ThemeProvider";
import { LogOut, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

const themes = [
  { id: "glass", label: "Glass" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "brutal", label: "Brutal" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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

      <div className="mx-5 mt-8">
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
