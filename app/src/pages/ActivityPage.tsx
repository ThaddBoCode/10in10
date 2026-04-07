import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { getActivities, addActivity } from "../lib/firestore";
import { isStravaConnected, syncStravaActivities, mapStravaType, stravaCalories } from "../lib/strava";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Footprints, Bike, Dumbbell, Waves, Mountain, Heart,
  Clock, MapPin, Timer, HeartPulse, Plus, X,
  Check, RefreshCw,
} from "lucide-react";

type Activity = {
  id: string;
  type: string;
  name: string;
  date: string;
  duration: number;
  stravaId?: string;
  distance: number | null;
  calories: number;
  avgHeartRate: number | null;
  pace: number | null;
  source: string;
};

const typeIcons: Record<string, typeof Footprints> = {
  run: Footprints,
  ride: Bike,
  swim: Waves,
  strength: Dumbbell,
  hike: Mountain,
  yoga: Heart,
  other: Footprints,
};

const typeLabels: Record<string, string> = {
  run: "Laufen",
  ride: "Radfahren",
  swim: "Schwimmen",
  strength: "Krafttraining",
  hike: "Wandern",
  yoga: "Yoga",
  other: "Sonstiges",
};

const typeColors: Record<string, string> = {
  run: "var(--accent)",
  ride: "var(--success)",
  swim: "var(--primary-light)",
  strength: "var(--warning)",
  hike: "var(--accent-light)",
  yoga: "var(--primary)",
  other: "var(--text-muted)",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}h`;
  return `${m} min`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export default function ActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  // Manual entry form
  const [formType, setFormType] = useState("run");
  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState("30");
  const [formCalories, setFormCalories] = useState("");
  const [formDistance, setFormDistance] = useState("");

  const [stravaConnected, setStravaConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const acts = await getActivities(user.uid, 30);
    setActivities((acts || []) as Activity[]);
    const connected = await isStravaConnected(user.uid);
    setStravaConnected(connected);
  };

  useEffect(() => { loadData(); }, [user]);

  const handleStravaSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const stravaActs = await syncStravaActivities(user.uid);
      for (const sa of stravaActs) {
        // Check if already imported (by stravaId)
        const existing = activities.find((a: Activity) => a.stravaId === String(sa.id));
        if (existing) continue;

        await addDoc(collection(db, "users", user.uid, "activities"), {
          stravaId: String(sa.id),
          type: mapStravaType(sa.type),
          name: sa.name,
          date: sa.start_date,
          duration: sa.moving_time,
          distance: sa.distance,
          calories: stravaCalories(sa),
          avgHeartRate: sa.average_heartrate ? Math.round(sa.average_heartrate) : null,
          source: "strava",
          createdAt: serverTimestamp(),
        });
      }
      await loadData();
    } catch (e) {
      console.error("Strava sync error:", e);
    }
    setSyncing(false);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await addActivity(user.uid, {
      type: formType,
      name: formName || typeLabels[formType],
      duration: parseInt(formDuration),
      calories: formCalories ? parseInt(formCalories) : undefined,
      distance: formDistance ? parseFloat(formDistance) * 1000 : undefined,
    });
    setShowAdd(false);
    setFormName("");
    setFormDuration("30");
    setFormCalories("");
    setFormDistance("");
    loadData();
  };

  // Weekly stats
  const thisWeek = activities.filter((a) => {
    const d = new Date(a.date);
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });
  const weeklyCalories = thisWeek.reduce((s, a) => s + a.calories, 0);
  const weeklyDuration = thisWeek.reduce((s, a) => s + a.duration, 0);

  return (
    <div className="pt-6">
      <div className="px-5">
        <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>Aktivitaeten</p>
        <h1 className="font-heading text-[26px]" style={{ color: "var(--text)" }}>Deine Bewegung</h1>
      </div>

      {/* Strava Status */}
      <div className="mx-5 mt-4 flex items-center gap-3 p-4"
           style={{
             background: stravaConnected ? "linear-gradient(135deg, #FC4C02, #FF7043)" : "var(--bg-card)",
             border: stravaConnected ? "none" : "1px solid var(--border)",
             borderRadius: "var(--card-radius)",
           }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={stravaConnected ? "white" : "var(--text-muted)"}>
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
        </svg>
        <div className="flex-1">
          <p className="font-heading text-sm" style={{ color: stravaConnected ? "white" : "var(--text)" }}>
            {stravaConnected ? "Strava verbunden" : "Strava nicht verbunden"}
          </p>
          <p className="font-body text-xs" style={{ color: stravaConnected ? "rgba(255,255,255,0.8)" : "var(--text-secondary)" }}>
            {stravaConnected ? "Klicke Sync um Aktivitaeten zu laden" : "Verbinde im Profil"}
          </p>
        </div>
        {stravaConnected && (
          <button onClick={handleStravaSync} disabled={syncing}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <RefreshCw size={16} className={`text-white ${syncing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Weekly Stats */}
      <div className="mx-5 mt-3 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] mb-2"
               style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
            <Footprints size={17} style={{ color: "var(--accent)" }} />
          </div>
          <p className="font-numbers text-2xl" style={{ color: "var(--text)" }}>
            {weeklyCalories > 0 ? weeklyCalories.toLocaleString() : "—"}
          </p>
          <p className="font-body mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>kcal diese Woche</p>
        </div>
        <div className="card p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] mb-2"
               style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
            <Timer size={17} style={{ color: "var(--primary-light)" }} />
          </div>
          <p className="font-numbers text-2xl" style={{ color: "var(--text)" }}>
            {weeklyDuration > 0 ? formatDuration(weeklyDuration) : "—"}
          </p>
          <p className="font-body mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>Trainingszeit</p>
        </div>
      </div>

      {/* Add Activity Button */}
      <div className="mt-5 flex items-center justify-between px-5">
        <h2 className="font-heading text-lg" style={{ color: "var(--text)" }}>Aktivitaeten</h2>
        <button onClick={() => setShowAdd(true)}
          className="font-body flex items-center gap-1 text-xs font-semibold"
          style={{ color: "var(--primary-light)" }}>
          <Plus size={14} /> Hinzufuegen
        </button>
      </div>

      {/* Activity List */}
      {activities.length === 0 && (
        <div className="card mx-5 mt-3 flex flex-col items-center p-8">
          <Footprints size={40} style={{ color: "var(--text-muted)" }} />
          <p className="font-body mt-3 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Noch keine Aktivitaeten. Verbinde Strava oder fuege manuell hinzu.
          </p>
        </div>
      )}

      {activities.map((a) => {
        const Icon = typeIcons[a.type] || Footprints;
        const color = typeColors[a.type] || "var(--text-muted)";
        return (
          <div key={a.id} className="card mx-5 mt-2 p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                     style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p className="font-heading text-sm" style={{ color: "var(--text)" }}>{a.name}</p>
                  <p className="font-body flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <Clock size={10} />
                    {new Date(a.date).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}
                    {a.source === "strava" && " \u2022 Strava"}
                  </p>
                </div>
              </div>
              <p className="font-numbers text-lg font-bold" style={{ color: "var(--accent)" }}>
                {a.calories} kcal
              </p>
            </div>
            <div className="flex gap-4">
              {a.distance && (
                <span className="font-body flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  <MapPin size={10} /> <strong style={{ color: "var(--text)" }}>{formatDistance(a.distance)}</strong>
                </span>
              )}
              <span className="font-body flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                <Timer size={10} /> <strong style={{ color: "var(--text)" }}>{formatDuration(a.duration)}</strong>
              </span>
              {a.avgHeartRate && (
                <span className="font-body flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  <HeartPulse size={10} /> <strong style={{ color: "var(--text)" }}>{a.avgHeartRate}</strong> bpm
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Add Activity Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-[600px] rounded-t-3xl p-6 pb-10"
               style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg" style={{ color: "var(--text)" }}>Aktivitaet hinzufuegen</h2>
              <button onClick={() => setShowAdd(false)}>
                <X size={20} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-3">
              {/* Type selector */}
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {Object.entries(typeLabels).map(([key, label]) => {
                  const Icon = typeIcons[key];
                  return (
                    <button key={key} type="button" onClick={() => setFormType(key)}
                      className="font-body flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{
                        background: formType === key ? "var(--primary)" : "var(--bg-card)",
                        color: formType === key ? "white" : "var(--text-secondary)",
                        border: `1px solid ${formType === key ? "var(--primary)" : "var(--border)"}`,
                      }}>
                      <Icon size={14} /> {label}
                    </button>
                  );
                })}
              </div>

              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder={typeLabels[formType] || "Name"}
                className="font-body w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-body mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dauer (min)</label>
                  <input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)}
                    className="font-numbers w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="font-body mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>kcal (opt.)</label>
                  <input type="number" value={formCalories} onChange={(e) => setFormCalories(e.target.value)}
                    placeholder="auto"
                    className="font-numbers w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="font-body mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>km (opt.)</label>
                  <input type="number" step="0.1" value={formDistance} onChange={(e) => setFormDistance(e.target.value)}
                    placeholder="—"
                    className="font-numbers w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
              </div>

              <button type="submit"
                className="font-heading flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
                <Check size={18} /> Speichern
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
