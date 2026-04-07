import { useEffect, useState, useCallback } from "react";
import { Check, Info, Star } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { addWeight, getTodayWeights, getWeights } from "../lib/firestore";

type Entry = {
  id: string;
  weight: number;
  date: string;
  time: string;
  isLowest: boolean;
};

export default function WeightPage() {
  const { user } = useAuth();
  const [currentWeight, setCurrentWeight] = useState(85.0);
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [recentDays, setRecentDays] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [todayData, historyData] = await Promise.all([
      getTodayWeights(user.uid),
      getWeights(user.uid, 7),
    ]);
    const todayList = (todayData || []) as Entry[];
    const historyList = (historyData || []) as Entry[];
    setTodayEntries(todayList);
    setRecentDays(historyList);

    if (todayList.length > 0) {
      const lowest = todayList.reduce((min: Entry, e: Entry) => e.weight < min.weight ? e : min, todayList[0]);
      setCurrentWeight(lowest.weight);
    } else if (historyList.length > 0) {
      setCurrentWeight(historyList[0].weight);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const adjust = (delta: number) => {
    setCurrentWeight(prev => Math.round((prev + delta) * 10) / 10);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await addWeight(user.uid, currentWeight);
    setSaving(false);
    setSaved(true);
    loadData();
    setTimeout(() => setSaved(false), 2000);
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }); }
    catch { return d; }
  };

  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col items-center px-5 pt-5">
      <p className="font-body text-base" style={{ color: "var(--text-secondary)" }}>Heutiges Gewicht</p>
      <p className="font-body mt-1 rounded-[10px] px-5 py-2 text-sm" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}>
        {today}
      </p>

      {/* Gewicht Eingabe */}
      <div className="card" style={{ margin: "20px 0", padding: "24px 16px", width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {/* Minus Seite */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => adjust(-1)}
              style={{ width: 48, height: 48, borderRadius: "50%", background: "color-mix(in srgb, var(--primary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span className="font-numbers" style={{ fontSize: 13, color: "var(--primary)" }}>-1</span>
            </button>
            <button onClick={() => adjust(-0.1)}
              style={{ width: 48, height: 48, borderRadius: "50%", background: "color-mix(in srgb, var(--primary) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span className="font-numbers" style={{ fontSize: 11, color: "var(--primary-light)" }}>-0,1</span>
            </button>
          </div>

          {/* Zahl */}
          <div style={{ minWidth: 130, padding: "0 8px" }}>
            <div className="font-numbers" style={{
              fontSize: 56, fontWeight: 500, lineHeight: 1, color: "var(--primary)",
            }}>
              {currentWeight.toFixed(1).replace(".", ",")}
            </div>
            <div className="font-body" style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>kg</div>
          </div>

          {/* Plus Seite */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => adjust(0.1)}
              style={{ width: 48, height: 48, borderRadius: "50%", background: "color-mix(in srgb, var(--primary) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span className="font-numbers" style={{ fontSize: 11, color: "var(--primary-light)" }}>+0,1</span>
            </button>
            <button onClick={() => adjust(1)}
              style={{ width: 48, height: 48, borderRadius: "50%", background: "color-mix(in srgb, var(--primary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span className="font-numbers" style={{ fontSize: 13, color: "var(--primary)" }}>+1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Speichern */}
      <button onClick={handleSave} disabled={saving}
        className="font-heading"
        style={{
          width: "100%", padding: "18px", borderRadius: 16, border: "none",
          background: saved ? "var(--success)" : "var(--gradient-accent, var(--accent))",
          color: "var(--bg)", fontSize: 17, fontWeight: 500, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
        <Check size={20} />
        {saving ? "Speichern..." : saved ? "Gespeichert!" : "Gewicht speichern"}
      </button>

      {/* Hint */}
      <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 12, textAlign: "center",
        background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)" }}>
        <Info size={16} style={{ color: "var(--accent)", margin: "0 auto 4px" }} />
        <p className="font-body" style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
          Du kannst <strong style={{ color: "var(--accent)" }}>mehrmals täglich</strong> wiegen.
          Für die Auswertung zählt der <strong style={{ color: "var(--accent)" }}>niedrigste Wert</strong>.
        </p>
      </div>

      {/* Heute */}
      {todayEntries.length > 0 && (
        <div style={{ width: "100%", marginTop: 20 }}>
          <p className="font-body" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Heute ({todayEntries.length} Messungen)
          </p>
          {todayEntries.map((e) => (
            <div key={e.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", marginBottom: 6, borderRadius: 12,
              background: e.isLowest ? "color-mix(in srgb, var(--accent) 5%, var(--bg-card))" : "var(--bg-card)",
              border: e.isLowest ? "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" : "1px solid var(--border)",
            }}>
              <div>
                <p className="font-numbers" style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}>{e.weight.toFixed(1).replace(".", ",")} kg</p>
                <p className="font-body" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e.time} Uhr</p>
              </div>
              {e.isLowest && (
                <span className="font-body" style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 500,
                  background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
                  <Star size={10} /> Tageswert
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Letzte Tage */}
      {recentDays.length > 0 && (
        <div style={{ width: "100%", marginTop: 20 }}>
          <p className="font-body" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Letzte Tage
          </p>
          {recentDays.slice(0, 5).map((e, i) => {
            const prev = recentDays[i + 1];
            const change = prev ? e.weight - prev.weight : 0;
            return (
              <div key={e.date} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", marginBottom: 8 }}>
                <div>
                  <p className="font-numbers" style={{ fontSize: 18, fontWeight: 500, color: "var(--text)" }}>{e.weight.toFixed(1).replace(".", ",")} kg</p>
                  <p className="font-body" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmtDate(e.date)}</p>
                </div>
                {change !== 0 && (
                  <span className="font-numbers" style={{
                    padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                    background: change < 0 ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--danger) 12%, transparent)",
                    color: change < 0 ? "var(--success)" : "var(--danger)",
                  }}>
                    {change > 0 ? "+" : ""}{change.toFixed(1).replace(".", ",")}
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
