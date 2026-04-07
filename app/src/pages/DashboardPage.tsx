import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { ArrowRight, Flame } from "lucide-react";
import { WeightChart } from "../components/charts/WeightChart";
import { DetailOverlay } from "../components/dashboard/DetailOverlay";
import { calculateBMR, getActivityMultiplier } from "../lib/calories";
import { projectCompletionDate } from "../lib/progress";
import { getActiveGoal, createGoal, getWeights, getStreak, getActivities } from "../lib/firestore";

type Goal = { id: string; startWeight: number; targetWeight: number; startDate: string; endDate: string; weeks: number };
type WeightEntry = { date: string; weight: number };

export default function DashboardPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<{ label: string; logged: boolean; isToday: boolean }[]>([]);
  const [todayTrainings, setTodayTrainings] = useState(0);
  const [weekTrainings, setWeekTrainings] = useState(0);
  const [weekCalories, setWeekCalories] = useState(0);

  const [startWeight, setStartWeight] = useState("90");
  const [targetWeight, setTargetWeight] = useState("80");
  const [weeks, setWeeks] = useState("10");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const g = await getActiveGoal(user.uid);
      if (g) setGoal(g as Goal); else setShowSetup(true);
      const w = await getWeights(user.uid, 90);
      setWeights((w || []) as unknown as WeightEntry[]);
      const s = await getStreak(user.uid);
      setStreak(s.streak || 0);
      setWeekDays(s.weekDays || []);

      // Activities
      const acts = (await getActivities(user.uid, 7)) as unknown as { date: string; calories: number }[];
      const today = new Date().toISOString().split("T")[0];
      setTodayTrainings(acts.filter(a => a.date?.startsWith(today)).length);
      setWeekTrainings(acts.length);
      setWeekCalories(acts.reduce((s, a) => s + (a.calories || 0), 0));
    };
    load();
  }, [user]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createGoal(user.uid, parseFloat(startWeight), parseFloat(targetWeight), parseInt(weeks));
    const g = await getActiveGoal(user.uid);
    if (g) { setGoal(g as Goal); setShowSetup(false); }
  };

  const currentWeight = weights.length > 0 ? weights[0].weight : goal?.startWeight || 0;
  const totalLoss = goal ? goal.startWeight - currentWeight : 0;
  const targetLoss = goal ? goal.startWeight - goal.targetWeight : 10;
  const currentWeek = goal ? Math.min(Math.floor((Date.now() - new Date(goal.startDate).getTime()) / (7 * 86400000)) + 1, goal.weeks) : 1;
  const weeklyTarget = goal ? targetLoss / goal.weeks : 1;
  const weeklyLossSoFar = weights.length >= 2 ? weights[weights.length > 7 ? weights.length - 7 : 0].weight - currentWeight : 0;
  const weekPct = weeklyTarget > 0 ? Math.min((weeklyLossSoFar / weeklyTarget) * 100, 100) : 0;
  const deficitPerDay = Math.round((weeklyTarget * 7700) / 7);
  const remaining = goal ? currentWeight - goal.targetWeight : 0;
  const weeksLeft = goal ? goal.weeks - currentWeek : 0;
  const weeklyNeeded = weeksLeft > 0 ? remaining / weeksLeft : remaining;
  const bmr = currentWeight > 0 ? calculateBMR(currentWeight) : 0;
  const totalCal = bmr + Math.round(bmr * (getActivityMultiplier("light") - 1));
  const weightChange = weights.length >= 2 ? weights[1].weight - weights[0].weight : 0;
  const avgWeeklyLoss = currentWeek > 0 ? totalLoss / currentWeek : 0;
  const projectedDate = goal && avgWeeklyLoss > 0 ? projectCompletionDate(currentWeight, goal.targetWeight, avgWeeklyLoss) : null;

  // Week training goal (hardcoded 5 for now, later from profile)
  const weekTrainingGoal = 5;
  const weekCalorieGoal = 3500;

  if (showSetup) {
    return (
      <div className="px-5 pt-6">
        <h1 className="font-heading text-2xl" style={{ color: "var(--text)" }}>Willkommen, {user?.displayName}!</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Lass uns dein Ziel festlegen.</p>
        <form onSubmit={handleCreateGoal} className="mt-8 space-y-4">
          {[["Startgewicht (kg)", startWeight, setStartWeight], ["Zielgewicht (kg)", targetWeight, setTargetWeight], ["Zeitraum (Wochen)", weeks, setWeeks]].map(([l, v, s]: any) => (
            <div key={l}><label className="font-body mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>{l}</label>
            <input type="number" step="0.1" value={v} onChange={e => s(e.target.value)} className="font-numbers w-full rounded-[14px] px-5 py-4 text-lg outline-none" style={{ background: "var(--bg-card)", border: "2px solid var(--border)", color: "var(--text)" }} /></div>
          ))}
          <button type="submit" className="font-heading w-full rounded-[14px] py-4 text-base font-bold text-white" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>Ziel starten</button>
        </form>
      </div>
    );
  }

  return (
    <div className="pt-4">
      {/* Header with date */}
      <div className="px-5">
        <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="font-heading text-[24px]" style={{ color: "var(--text)" }}>Hallo {user?.displayName}</h1>
      </div>

      {/* === HEUTE === */}
      {/* Hero: Gewicht + 2 Ringe */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 20px" }}>
        <div>
          <div className="font-numbers" style={{ fontSize: 48, fontWeight: 500, color: "var(--primary)", lineHeight: 1 }}>
            {currentWeight.toFixed(1)}
          </div>
          <div className="font-body" style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            kg {weightChange !== 0 && <span>· {weightChange < 0 ? "↓" : "↑"}{Math.abs(weightChange).toFixed(1)} seit gestern</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {/* Ring: Verbrauch */}
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <svg viewBox="0 0 72 72" style={{ width: "100%", height: "100%" }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="4" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--primary)" strokeWidth="4"
                strokeDasharray="188" strokeDashoffset={188 - (188 * 0.4)} strokeLinecap="round"
                transform="rotate(-90 36 36)" />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div className="font-numbers" style={{ fontSize: 12, fontWeight: 500, color: "var(--primary)" }}>{totalCal.toLocaleString()}</div>
              <div style={{ fontSize: 6, color: "var(--text-muted)" }}>Verbrauch</div>
            </div>
          </div>

          {/* Ring: Defizit */}
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <svg viewBox="0 0 72 72" style={{ width: "100%", height: "100%" }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="4" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--primary-light)" strokeWidth="4"
                strokeDasharray="188" strokeDashoffset={188 - (188 * 0.75)} strokeLinecap="round"
                transform="rotate(-90 36 36)" />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div className="font-numbers" style={{ fontSize: 12, fontWeight: 500, color: "var(--primary-light)" }}>-{deficitPerDay}</div>
              <div style={{ fontSize: 6, color: "var(--text-muted)" }}>Defizit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Heute Zeile: Verbrannt / Gegessen / Trainings */}
      <div style={{ display: "flex", gap: 1, margin: "0 20px", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ flex: 1, padding: 10, background: "color-mix(in srgb, var(--primary) 6%, transparent)", textAlign: "center" }}>
          <div className="font-body" style={{ fontSize: 7, color: "var(--text-muted)", textTransform: "uppercase" }}>Verbrannt</div>
          <div className="font-numbers" style={{ fontSize: 16, fontWeight: 500, color: "var(--primary)", marginTop: 2 }}>{totalCal.toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, padding: 10, background: "color-mix(in srgb, var(--danger) 6%, transparent)", textAlign: "center" }}>
          <div className="font-body" style={{ fontSize: 7, color: "var(--text-muted)", textTransform: "uppercase" }}>Gegessen</div>
          <div className="font-numbers" style={{ fontSize: 16, fontWeight: 500, color: "var(--danger)", marginTop: 2 }}>—</div>
        </div>
        <div style={{ flex: 1, padding: 10, background: "color-mix(in srgb, var(--primary) 6%, transparent)", textAlign: "center" }}>
          <div className="font-body" style={{ fontSize: 7, color: "var(--text-muted)", textTransform: "uppercase" }}>Trainings</div>
          <div className="font-numbers" style={{ fontSize: 16, fontWeight: 500, color: "var(--primary)", marginTop: 2 }}>{todayTrainings}</div>
        </div>
      </div>

      {/* === DIESE WOCHE === */}
      <div className="font-body" style={{ margin: "14px 20px 0", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.5 }}>
        Diese Woche · W{currentWeek}/{goal?.weeks}
      </div>

      {/* Gewicht */}
      <div className="card" style={{ margin: "8px 20px", padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="font-body" style={{ fontSize: 12, fontWeight: 500 }}>Gewicht</span>
          <span className="font-numbers" style={{ fontSize: 11, color: "var(--primary-light)" }}>-{weeklyLossSoFar.toFixed(1)} von -{weeklyTarget.toFixed(1)} kg</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "color-mix(in srgb, var(--primary) 8%, transparent)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.max(0, weekPct)}%`, borderRadius: 4, background: "var(--primary)" }} />
        </div>
      </div>

      {/* Training */}
      <div className="card" style={{ margin: "6px 20px", padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="font-body" style={{ fontSize: 12, fontWeight: 500 }}>Training</span>
          <span className="font-numbers" style={{ fontSize: 11, color: "var(--primary-light)" }}>{weekTrainings} von {weekTrainingGoal}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: weekTrainingGoal }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < weekTrainings ? "var(--primary)" : "color-mix(in srgb, var(--primary) 10%, transparent)" }} />
          ))}
        </div>
      </div>

      {/* Kalorien */}
      <div className="card" style={{ margin: "6px 20px", padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="font-body" style={{ fontSize: 12, fontWeight: 500 }}>Kalorien (Training)</span>
          <span className="font-numbers" style={{ fontSize: 11, color: "var(--primary-light)" }}>{weekCalories.toLocaleString()} / {weekCalorieGoal.toLocaleString()}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "color-mix(in srgb, var(--primary) 8%, transparent)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min((weekCalories / weekCalorieGoal) * 100, 100)}%`, borderRadius: 4, background: "var(--primary)" }} />
        </div>
      </div>

      {/* Streak */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 20px", padding: "8px 12px", borderRadius: 12, background: "color-mix(in srgb, var(--primary) 4%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 8%, transparent)" }}>
        <Flame size={16} style={{ color: "var(--primary)" }} />
        <span className="font-numbers" style={{ fontWeight: 500, color: "var(--primary)" }}>{streak}</span>
        <span className="font-body" style={{ fontSize: 10, color: "var(--text-muted)" }}>Tage gewogen</span>
        {weekDays.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
            {weekDays.map((d) => (
              <div key={d.label} style={{
                width: 16, height: 16, borderRadius: 3, fontSize: 7, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: d.logged ? "var(--primary)" : d.isToday ? "transparent" : "var(--border)",
                color: d.logged ? "white" : "var(--text-muted)",
                border: d.isToday && !d.logged ? "1.5px solid var(--primary)" : "none",
              }}>{d.label[0]}</div>
            ))}
          </div>
        )}
      </div>

      {/* Weight Chart */}
      {goal && weights.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 8px" }}>
            <h2 className="font-heading" style={{ fontSize: 15, color: "var(--text)" }}>Gewichtsverlauf</h2>
            <Link to="/charts" className="font-body" style={{ fontSize: 11, color: "var(--primary-light)", display: "flex", alignItems: "center", gap: 4 }}>
              Alle <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card" style={{ margin: "0 20px", padding: 14 }}>
            <WeightChart entries={weights} startWeight={goal.startWeight} targetWeight={goal.targetWeight} weeks={goal.weeks} startDate={goal.startDate} />
          </div>
        </>
      )}

      {/* Detail Overlays */}
      <DetailOverlay open={activeDetail === "weight"} onClose={() => setActiveDetail(null)} title="Gewicht" subtitle="Detail" bigValue={currentWeight.toFixed(1)} bigUnit="kg"
        sections={[{ title: "Uebersicht", rows: [
          { label: "Start", value: `${goal?.startWeight} kg` },
          { label: "Aktuell", value: `${currentWeight.toFixed(1)} kg` },
          { label: "Ziel", value: `${goal?.targetWeight} kg` },
          { label: "Verloren", value: `-${totalLoss.toFixed(1)} kg` },
          { label: "Noch", value: `-${remaining.toFixed(1)} kg` },
          { label: "Benoetigt/Woche", value: `-${weeklyNeeded.toFixed(2)} kg` },
          ...(projectedDate ? [{ label: "Prognose", value: projectedDate.toLocaleDateString("de-DE") }] : []),
        ]}]} />
    </div>
  );
}
