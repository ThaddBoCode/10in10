"use client";

import { useAuth } from "@/components/AuthGuard";
import { useEffect, useState } from "react";
import {
  Target, Compass, CheckCircle2, Lightbulb, Flame,
  Scale, Activity, BarChart3, TrendingDown, Zap,
  ArrowUp, ChevronRight, ArrowRight, Footprints,
  Clock, MapPin, Timer, HeartPulse,
} from "lucide-react";
import Link from "next/link";
import { WeightChart } from "@/components/charts/WeightChart";
import { DetailOverlay } from "@/components/dashboard/DetailOverlay";
import { calculateBMR, getActivityMultiplier, calculateDailyDeficit } from "@/lib/calories";
import { projectCompletionDate } from "@/lib/progress";

type Goal = {
  id: string;
  startWeight: number;
  targetWeight: number;
  startDate: string;
  endDate: string;
  weeks: number;
};

type WeightEntry = {
  date: string;
  weight: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<{ label: string; logged: boolean; isToday: boolean; isFuture: boolean }[]>([]);

  // Setup form
  const [startWeight, setStartWeight] = useState("90");
  const [targetWeight, setTargetWeight] = useState("80");
  const [weeks, setWeeks] = useState("10");

  useEffect(() => {
    fetch("/api/goals").then(r => r.json()).then(d => {
      if (d.goal) setGoal(d.goal);
      else setShowSetup(true);
    });
    fetch("/api/weight?days=90").then(r => r.json()).then(d => setWeights(d.entries || []));
    fetch("/api/stats/streak").then(r => r.json()).then(d => {
      setStreak(d.streak || 0);
      setWeekDays(d.weekDays || []);
    });
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startWeight: parseFloat(startWeight),
        targetWeight: parseFloat(targetWeight),
        weeks: parseInt(weeks),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setGoal(data.goal);
      setShowSetup(false);
    }
  };

  // Calculate progress
  const currentWeight = weights.length > 0 ? weights[0].weight : goal?.startWeight || 0;
  const totalLoss = goal ? goal.startWeight - currentWeight : 0;
  const targetLoss = goal ? goal.startWeight - goal.targetWeight : 10;
  const progressPct = targetLoss > 0 ? Math.min((totalLoss / targetLoss) * 100, 100) : 0;

  const currentWeek = goal
    ? Math.min(Math.floor((Date.now() - new Date(goal.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1, goal.weeks)
    : 1;
  const plannedLoss = goal ? (targetLoss / goal.weeks) * currentWeek : 0;
  const diff = plannedLoss - totalLoss;

  const status = diff <= 0 ? "ahead" : diff < 0.5 ? "on-track" : diff < 1.5 ? "slightly-behind" : "behind";
  const statusLabel = { ahead: "Voraus!", "on-track": "Auf Kurs", "slightly-behind": "Leicht hinter Plan", behind: "Hinter Plan" }[status];
  const statusColor = { ahead: "var(--accent)", "on-track": "var(--success)", "slightly-behind": "var(--warning)", behind: "var(--danger)" }[status];

  const weeklyTarget = goal ? targetLoss / goal.weeks : 1;
  const deficitPerDay = Math.round((weeklyTarget * 7700) / 7);
  const remaining = goal ? currentWeight - goal.targetWeight : 0;
  const weeksLeft = goal ? goal.weeks - currentWeek : 0;
  const weeklyNeeded = weeksLeft > 0 ? remaining / weeksLeft : remaining;

  // BMR & Calories
  const bmr = currentWeight > 0 ? calculateBMR(currentWeight, user?.height) : 0;
  const actMult = getActivityMultiplier(user?.activityLevel || "light");
  const dailyActivity = Math.round(bmr * (actMult - 1));
  const totalCal = bmr + dailyActivity;

  // 7-day average
  const avg7 = weights.length > 0
    ? (weights.slice(0, 7).reduce((s, w) => s + w.weight, 0) / Math.min(weights.length, 7)).toFixed(1)
    : null;

  // Projected date
  const avgWeeklyLoss = currentWeek > 0 ? totalLoss / currentWeek : 0;
  const projectedDate = goal && avgWeeklyLoss > 0
    ? projectCompletionDate(currentWeight, goal.targetWeight, avgWeeklyLoss)
    : null;

  if (showSetup) {
    return (
      <div className="px-5 pt-6">
        <h1 className="font-heading text-2xl" style={{ color: "var(--text)" }}>Willkommen, {user?.name}!</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Lass uns dein Ziel festlegen.
        </p>
        <form onSubmit={handleCreateGoal} className="mt-8 space-y-4">
          <div>
            <label className="font-body mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Startgewicht (kg)</label>
            <input type="number" step="0.1" value={startWeight} onChange={e => setStartWeight(e.target.value)}
              className="font-numbers w-full rounded-[14px] px-5 py-4 text-lg outline-none"
              style={{ background: "var(--bg-card)", border: "2px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div>
            <label className="font-body mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Zielgewicht (kg)</label>
            <input type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
              className="font-numbers w-full rounded-[14px] px-5 py-4 text-lg outline-none"
              style={{ background: "var(--bg-card)", border: "2px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div>
            <label className="font-body mb-1 block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Zeitraum (Wochen)</label>
            <input type="number" value={weeks} onChange={e => setWeeks(e.target.value)}
              className="font-numbers w-full rounded-[14px] px-5 py-4 text-lg outline-none"
              style={{ background: "var(--bg-card)", border: "2px solid var(--border)", color: "var(--text)" }} />
          </div>
          <button type="submit"
            className="font-heading w-full rounded-[14px] py-4 text-base font-bold text-white"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
            Ziel starten
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="pt-4">
      {/* Header */}
      <div className="px-5">
        <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>Guten Tag,</p>
        <h1 className="font-heading text-[26px]" style={{ color: "var(--text)" }}>{user?.name}</h1>
      </div>

      {/* Goal Banner */}
      <div className="gradient-banner relative mx-5 mt-4 overflow-hidden p-5">
        <div className="absolute -right-8 -top-8 h-[120px] w-[120px] rounded-full bg-white/[0.08]" />
        <div className="relative">
          <p className="font-body flex items-center gap-1.5 text-[11px] uppercase tracking-[2px] text-white/80">
            <Target size={14} /> Dein Ziel
          </p>
          <p className="font-numbers mt-1 text-[40px] leading-tight text-white">
            -{totalLoss.toFixed(1)} kg
          </p>
          <p className="font-body text-[13px] text-white/75">
            von {targetLoss.toFixed(0)} kg in {goal?.weeks} Wochen &bull; Woche {currentWeek}/{goal?.weeks}
          </p>
          <div className="mt-3.5 h-[5px] overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white/85 transition-all duration-1000" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Kurs Tracker */}
      <div className="card mx-5 mt-4 p-5">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-heading flex items-center gap-2 text-[15px]" style={{ color: "var(--text)" }}>
            <Compass size={18} style={{ color: "var(--primary-light)" }} />
            Auf Kurs?
          </h2>
          <span className="font-body flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-bold"
                style={{ background: `color-mix(in srgb, ${statusColor} 15%, transparent)`, color: statusColor }}>
            <CheckCircle2 size={13} /> {statusLabel}
          </span>
        </div>

        <div className="mb-3.5 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="font-body text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Soll (W{currentWeek})</p>
            <p className="font-numbers mt-1 text-xl" style={{ color: "var(--text)" }}>-{plannedLoss.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="font-body text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Ist</p>
            <p className="font-numbers mt-1 text-xl" style={{ color: "var(--success)" }}>-{totalLoss.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="font-body text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Diff</p>
            <p className="font-numbers mt-1 text-xl" style={{ color: diff > 0 ? "var(--warning)" : "var(--accent)" }}>
              {diff > 0 ? "+" : ""}{diff.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="rounded-[14px] p-3.5" style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)" }}>
          <p className="font-heading mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider" style={{ color: "var(--primary-light)" }}>
            <Lightbulb size={13} /> Wochenplan
          </p>
          <div className="space-y-1">
            {[
              ["Wochenziel", `-${weeklyTarget.toFixed(1)} kg`, "var(--primary-light)"],
              ["Noch diese Woche", `-${Math.max(0, weeklyTarget - (totalLoss - (weeklyTarget * (currentWeek - 1)))).toFixed(1)} kg`, "var(--warning)"],
              ["Empf. Defizit/Tag", `~${deficitPerDay} kcal`, "var(--accent)"],
            ].map(([label, value, color]) => (
              <div key={label} className="flex justify-between py-1">
                <span className="font-body text-[13px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span className="font-numbers text-sm font-bold" style={{ color: color as string }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="mx-5 mt-3 flex items-center gap-3 rounded-[var(--card-radius)] p-3.5"
           style={{ background: "color-mix(in srgb, var(--warning) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--warning) 12%, transparent)", borderRadius: "var(--card-radius)" }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px]"
             style={{ background: "linear-gradient(135deg, var(--danger), var(--warning))" }}>
          <Flame size={20} className="text-white" />
        </div>
        <div>
          <p className="font-numbers text-2xl" style={{ color: "var(--text)" }}>{streak}</p>
          <p className="font-body text-[10px]" style={{ color: "var(--text-secondary)" }}>Tage in Folge</p>
        </div>
        {weekDays.length > 0 && (
          <div className="ml-auto flex gap-1">
            {weekDays.map((d) => (
              <div key={d.label}
                className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-semibold"
                style={{
                  background: d.logged ? "var(--success)" : d.isToday ? "transparent" : "var(--border)",
                  color: d.logged ? "white" : "var(--text-muted)",
                  border: d.isToday && !d.logged ? "2px solid var(--primary)" : "none",
                  fontFamily: "var(--font-body)",
                }}>
                {d.label[0]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="mx-5 mt-3 grid grid-cols-2 gap-3">
        {[
          { id: "weight", icon: Scale, color: "var(--primary-light)", label: "Gewicht (kg)", value: currentWeight.toFixed(1), change: weights.length >= 2 ? (weights[1].weight - weights[0].weight).toFixed(1) : null, changeIcon: TrendingDown },
          { id: "calories", icon: Flame, color: "var(--accent)", label: "Kalorien", value: bmr > 0 ? bmr.toLocaleString() : "—", change: null, changeIcon: Zap },
          { id: "training", icon: Activity, color: "var(--success)", label: "Trainings", value: "—", change: null, changeIcon: ArrowUp },
          { id: "average", icon: BarChart3, color: "var(--warning)", label: "\u00D8 7 Tage", value: avg7 || "—", change: null, changeIcon: TrendingDown },
        ].map((stat) => (
          <div key={stat.id} onClick={() => setActiveDetail(stat.id)} className="card p-4 transition-transform hover:-translate-y-0.5 cursor-pointer">
            <div className="mb-2.5 flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: `color-mix(in srgb, ${stat.color} 12%, transparent)` }}>
                <stat.icon size={17} style={{ color: stat.color }} />
              </div>
              <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="font-numbers text-2xl" style={{ color: "var(--text)" }}>{stat.value}</p>
            <p className="font-body mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>{stat.label}</p>
            {stat.change && parseFloat(stat.change) !== 0 && (
              <span className="font-body mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: "color-mix(in srgb, var(--success) 12%, transparent)", color: "var(--success)" }}>
                <stat.changeIcon size={11} /> {Math.abs(parseFloat(stat.change))}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Weight Chart */}
      {goal && weights.length > 0 && (
        <>
          <div className="mt-5 flex items-center justify-between px-5">
            <h2 className="font-heading text-lg" style={{ color: "var(--text)" }}>Gewichtsverlauf</h2>
            <Link href="/charts" className="font-body flex items-center gap-1 text-xs" style={{ color: "var(--primary-light)" }}>
              Alle anzeigen <ArrowRight size={13} />
            </Link>
          </div>
          <div className="card mx-5 mt-3 p-4">
            <WeightChart
              entries={weights}
              startWeight={goal.startWeight}
              targetWeight={goal.targetWeight}
              weeks={goal.weeks}
              startDate={goal.startDate}
            />
            <div className="mt-3 flex justify-center gap-4">
              {[
                { color: "var(--primary)", label: "Taeglich" },
                { color: "var(--accent)", label: "\u00D8 7 Tage" },
                { color: "var(--primary-light)", label: "Soll", dashed: true },
                { color: "var(--danger)", label: "Ziel", dashed: true },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: l.color, opacity: l.dashed ? 0.5 : 1 }} />
                  <span className="font-body text-[10px]" style={{ color: "var(--text-muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Activities section */}
      <div className="mt-5 flex items-center justify-between px-5">
        <h2 className="font-heading text-lg" style={{ color: "var(--text)" }}>Aktivitaeten</h2>
        <Link href="/charts" className="font-body flex items-center gap-1 text-xs" style={{ color: "var(--primary-light)" }}>
          Alle <ArrowRight size={13} />
        </Link>
      </div>
      <div className="card mx-5 mt-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
            <Footprints size={20} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="font-heading text-sm" style={{ color: "var(--text)" }}>Strava verbinden</p>
            <p className="font-body text-[11px]" style={{ color: "var(--text-secondary)" }}>
              Verbinde Strava im Profil fuer automatisches Tracking
            </p>
          </div>
        </div>
      </div>

      {/* Detail Overlays */}
      <DetailOverlay
        open={activeDetail === "weight"}
        onClose={() => setActiveDetail(null)}
        title="Gewicht"
        subtitle="Dein aktuelles Gewicht im Detail"
        bigValue={currentWeight.toFixed(1)}
        bigUnit="kg"
        sections={[
          {
            title: "Uebersicht",
            rows: [
              { label: "Startgewicht", value: `${goal?.startWeight} kg` },
              { label: "Aktuell", value: `${currentWeight.toFixed(1)} kg` },
              { label: "Zielgewicht", value: `${goal?.targetWeight} kg` },
              { label: "Verloren", value: `-${totalLoss.toFixed(1)} kg`, color: "var(--success)" },
              { label: "Noch zu verlieren", value: `-${remaining.toFixed(1)} kg`, color: "var(--primary-light)" },
              { label: "\u00D8 pro Woche", value: `${currentWeek > 0 ? (totalLoss / currentWeek).toFixed(2) : "—"} kg` },
              { label: "Benoetigt/Woche (Soll)", value: `-${weeklyNeeded.toFixed(2)} kg`, color: "var(--warning)" },
              ...(projectedDate ? [{ label: "Prognose Ziel erreicht", value: projectedDate.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }), color: "var(--accent)" }] : []),
            ],
          },
        ]}
      />

      <DetailOverlay
        open={activeDetail === "calories"}
        onClose={() => setActiveDetail(null)}
        title="Kalorien heute"
        subtitle="Dein Energieverbrauch im Detail"
        bigValue={bmr > 0 ? bmr.toLocaleString() : "—"}
        bigUnit="kcal Grundumsatz"
        sections={[
          {
            title: "Aufschluesselung",
            rows: [
              { label: "Grundumsatz (BMR)", value: `${bmr} kcal` },
              { label: "Alltagsaktivitaet", value: `${dailyActivity} kcal` },
              { label: "Training", value: "0 kcal", color: "var(--accent)" },
              { label: "Gesamt", value: `${totalCal} kcal`, color: "var(--accent)", bold: true },
            ],
          },
          {
            title: "Empfehlung",
            rows: [
              { label: "Empf. Kalorienaufnahme", value: `${Math.max(bmr, totalCal - deficitPerDay)} kcal`, color: "var(--primary-light)" },
              { label: "Damit Defizit von", value: `${deficitPerDay} kcal`, color: "var(--success)" },
              { label: "= ca. Gewichtsverlust/Woche", value: `~${weeklyTarget.toFixed(1)} kg` },
            ],
          },
        ]}
      />

      <DetailOverlay
        open={activeDetail === "average"}
        onClose={() => setActiveDetail(null)}
        title="\u00D8 Gewicht (7 Tage)"
        subtitle="Glaettet taegliche Schwankungen"
        bigValue={avg7 || "—"}
        bigUnit="kg (7-Tage-Schnitt)"
        sections={[
          {
            title: "Warum Durchschnitt?",
            rows: [
              { label: "Dein Gewicht schwankt taeglich um 1-2 kg durch Wasser und Nahrung. Der 7-Tage-Durchschnitt zeigt den echten Trend.", value: "" },
            ],
          },
        ]}
      />

      <DetailOverlay
        open={activeDetail === "training"}
        onClose={() => setActiveDetail(null)}
        title="Trainings"
        subtitle="Deine Aktivitaeten"
        bigValue="—"
        bigUnit="Diese Woche"
        sections={[
          {
            title: "Info",
            rows: [
              { label: "Verbinde Strava im Profil fuer automatisches Tracking", value: "" },
            ],
          },
        ]}
      />
    </div>
  );
}
