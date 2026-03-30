import { useEffect, useState, useRef } from "react";
import { Scale, Flame, Camera, Heart, Plus } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { getActiveGoal, getWeights } from "../lib/firestore";
import { WeightChart } from "../components/charts/WeightChart";
import { CalorieBarChart } from "../components/charts/CalorieBarChart";

type Goal = {
  startWeight: number;
  targetWeight: number;
  weeks: number;
  startDate: string;
};

type WeightEntry = { date: string; weight: number };

type Photo = { id: string; weekNumber: number; photoPath: string };

const tabs = [
  { id: "weight", label: "Gewicht", icon: Scale },
  { id: "calories", label: "Kalorien", icon: Flame },
  { id: "photos", label: "Fotos", icon: Camera },
  { id: "bmi", label: "BMI", icon: Heart },
];

export default function ChartsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("weight");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [photos] = useState<Photo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadWeek, setUploadWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const g = await getActiveGoal(user.uid);
      if (g) setGoal(g as Goal);
      const w = await getWeights(user.uid, 90);
      setWeights((w || []) as unknown as WeightEntry[]);
    };
    load();
  }, [user]);

  // Mock calorie data for the week
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const calorieData = days.map((label) => ({
    label,
    bmr: 1800 + Math.floor(Math.random() * 200),
    training: Math.random() > 0.3 ? 200 + Math.floor(Math.random() * 500) : 0,
  }));

  return (
    <div className="pt-6">
      <div className="px-5">
        <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
          Statistiken
        </p>
        <h1 className="font-heading text-[26px]" style={{ color: "var(--text)" }}>
          Dein Fortschritt
        </h1>
      </div>

      {/* Tab Bar */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="font-body flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? "var(--primary)" : "transparent",
              color: activeTab === tab.id ? "white" : "var(--text-secondary)",
              border: `1px solid ${activeTab === tab.id ? "var(--primary)" : "var(--border)"}`,
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Weight Tab */}
      {activeTab === "weight" && goal && (
        <div className="card mx-5 mt-4 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-[15px]" style={{ color: "var(--text)" }}>
              Gewichtsverlauf
            </h2>
          </div>
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
              { color: "var(--primary-light)", label: "Soll", opacity: 0.4 },
              { color: "var(--danger)", label: "Ziel", opacity: 0.8 },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: l.color, opacity: l.opacity || 1 }}
                />
                <span className="font-body text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "weight" && !goal && (
        <div className="card mx-5 mt-4 flex flex-col items-center p-10">
          <Scale size={48} style={{ color: "var(--text-muted)" }} />
          <p className="font-body mt-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Erstelle zuerst ein Ziel auf dem Dashboard.
          </p>
        </div>
      )}

      {/* Calories Tab */}
      {activeTab === "calories" && (
        <div className="card mx-5 mt-4 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-[15px]" style={{ color: "var(--text)" }}>
              Kalorienverbrauch (Woche)
            </h2>
          </div>
          <CalorieBarChart data={calorieData} />
          <div className="mt-3 flex justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
              <span className="font-body text-[10px]" style={{ color: "var(--text-muted)" }}>Grundumsatz</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="font-body text-[10px]" style={{ color: "var(--text-muted)" }}>Training</span>
            </div>
          </div>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === "photos" && (
        <div className="mx-5 mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => {
              // Photo upload not yet implemented with Firebase Storage
              setUploadWeek(null);
            }}
          />
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: goal?.weeks || 10 }, (_, i) => {
              const week = i + 1;
              const photo = photos.find((p) => p.weekNumber === week);
              return (
                <button
                  key={week}
                  onClick={() => {
                    if (!photo) {
                      setUploadWeek(week);
                      fileInputRef.current?.click();
                    }
                  }}
                  className="relative flex aspect-square flex-col items-center justify-center overflow-hidden"
                  style={{
                    background: "var(--bg-card)",
                    border: photo ? "2px solid var(--primary)" : "1px solid var(--border)",
                    borderRadius: "var(--card-radius)",
                  }}
                >
                  {photo ? (
                    <>
                      <img
                        src={photo.photoPath}
                        alt={`Woche ${week}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                        <span className="font-body text-[10px] text-white">Woche {week}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Plus size={20} style={{ color: "var(--text-muted)" }} />
                      <span className="font-body mt-1 text-[9px]" style={{ color: "var(--text-muted)" }}>
                        Woche {week}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BMI Tab */}
      {activeTab === "bmi" && (
        <div className="card mx-5 mt-4 p-5">
          <h2 className="font-heading mb-4 text-[15px]" style={{ color: "var(--text)" }}>BMI</h2>
          {weights.length > 0 ? (
            <div className="text-center">
              <p className="font-numbers text-[48px]" style={{ color: "var(--text)" }}>
                {(weights[0].weight / (1.8 * 1.8)).toFixed(1)}
              </p>
              <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                Aktueller BMI (bei 180 cm)
              </p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                <div className="flex h-full">
                  <div className="h-full" style={{ width: "18.5%", background: "var(--accent)" }} />
                  <div className="h-full" style={{ width: "6.5%", background: "var(--success)" }} />
                  <div className="h-full" style={{ width: "5%", background: "var(--warning)" }} />
                  <div className="h-full" style={{ width: "70%", background: "var(--danger)" }} />
                </div>
              </div>
              <div className="mt-1 flex justify-between text-[9px]" style={{ color: "var(--text-muted)" }}>
                <span>Unter</span>
                <span>Normal</span>
                <span>Ueber</span>
                <span>Adipos</span>
              </div>
            </div>
          ) : (
            <p className="font-body text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Noch keine Gewichtsdaten.
            </p>
          )}
        </div>
      )}

      {/* Weight history below chart */}
      {activeTab === "weight" && weights.length > 0 && (
        <div className="mx-5 mt-4">
          <h3 className="font-body mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Alle Eintraege
          </h3>
          {weights.map((e, i) => {
            const prev = weights[i + 1];
            const change = prev ? e.weight - prev.weight : 0;
            return (
              <div key={e.date} className="card mb-2 flex items-center justify-between p-3.5">
                <div>
                  <p className="font-numbers text-base font-bold" style={{ color: "var(--text)" }}>
                    {e.weight.toFixed(1)} kg
                  </p>
                  <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                    {new Date(e.date).toLocaleDateString("de-DE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                {change !== 0 && (
                  <span
                    className="font-numbers rounded-md px-2 py-1 text-xs font-semibold"
                    style={{
                      background: change < 0 ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--danger) 12%, transparent)",
                      color: change < 0 ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {change > 0 ? "+" : ""}
                    {change.toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
