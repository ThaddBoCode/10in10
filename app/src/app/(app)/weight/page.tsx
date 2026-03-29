"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Info, Star } from "lucide-react";

type Entry = {
  id: string;
  weight: number;
  date: string;
  time: string;
  isLowest: boolean;
};

export default function WeightPage() {
  const [currentWeight, setCurrentWeight] = useState(85.0);
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [recentDays, setRecentDays] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 50;

  const loadData = useCallback(async () => {
    const [todayRes, historyRes] = await Promise.all([
      fetch("/api/weight/today"),
      fetch("/api/weight?days=7"),
    ]);
    const todayData = await todayRes.json();
    const historyData = await historyRes.json();
    setTodayEntries(todayData.entries || []);
    setRecentDays(historyData.entries || []);

    // Set picker to last known weight
    const allEntries = todayData.entries || [];
    if (allEntries.length > 0) {
      const lowest = allEntries.reduce((min: Entry, e: Entry) => e.weight < min.weight ? e : min, allEntries[0]);
      setCurrentWeight(lowest.weight);
    } else if (historyData.entries?.length > 0) {
      setCurrentWeight(historyData.entries[0].weight);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Scroll to current weight on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const index = Math.round((120 - currentWeight) * 10);
    scrollRef.current.scrollTop = index * itemHeight - scrollRef.current.offsetHeight / 2 + itemHeight / 2;
  }, [currentWeight]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const center = scrollRef.current.scrollTop + scrollRef.current.offsetHeight / 2;
    const index = Math.round(center / itemHeight);
    const weight = 120 - index * 0.1;
    setCurrentWeight(Math.round(weight * 10) / 10);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: currentWeight }),
    });
    setSaving(false);
    setSaved(true);
    loadData();
    setTimeout(() => setSaved(false), 2000);
  };

  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col items-center px-5 pt-5">
      <p className="font-body text-base" style={{ color: "var(--text-secondary)" }}>Heutiges Gewicht</p>
      <p className="font-body mt-1 rounded-[10px] px-5 py-2 text-sm" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}>
        {today}
      </p>

      {/* Weight display */}
      <p className="font-numbers mt-4 text-[72px] leading-none"
         style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {currentWeight.toFixed(1)}
      </p>
      <p className="font-numbers text-2xl" style={{ color: "var(--text-secondary)" }}>kg</p>

      {/* Scroll picker */}
      <div className="relative mt-5 h-[200px] w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[60px]"
             style={{ background: "linear-gradient(to bottom, var(--bg), transparent)" }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[60px]"
             style={{ background: "linear-gradient(to top, var(--bg), transparent)" }} />
        <div className="pointer-events-none absolute inset-x-[10%] top-1/2 z-[5] h-[50px] -translate-y-1/2 rounded-xl"
             style={{ borderTop: "2px solid var(--primary)", borderBottom: "2px solid var(--primary)", background: "color-mix(in srgb, var(--primary) 8%, transparent)" }} />

        <div ref={scrollRef} onScroll={handleScroll}
             className="no-scrollbar h-full overflow-y-scroll"
             style={{ scrollSnapType: "y mandatory" }}>
          <div style={{ height: 75 }} />
          {Array.from({ length: 801 }, (_, i) => {
            const w = (120 - i * 0.1).toFixed(1);
            const isSelected = w === currentWeight.toFixed(1);
            return (
              <div key={w} className="flex items-center justify-center transition-all"
                   style={{ height: itemHeight, scrollSnapAlign: "center",
                     fontSize: isSelected ? 28 : 22,
                     fontWeight: isSelected ? "var(--font-numbers-weight)" as unknown as number : 400,
                     fontFamily: "var(--font-numbers)",
                     color: isSelected ? "var(--text)" : "var(--text-muted)" }}>
                {w}
              </div>
            );
          })}
          <div style={{ height: 75 }} />
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="font-heading mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-[18px] text-[17px] font-bold transition-transform hover:-translate-y-0.5"
        style={{
          background: saved ? "var(--success)" : "var(--gradient-accent, var(--accent))",
          color: "var(--bg)",
          boxShadow: "var(--glow-accent)",
        }}>
        <Check size={20} />
        {saving ? "Speichern..." : saved ? "Gespeichert!" : "Gewicht speichern"}
      </button>

      {/* Multiple entries hint */}
      <div className="mt-3 w-full rounded-xl p-3 text-center"
           style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)" }}>
        <Info size={16} className="mx-auto mb-1" style={{ color: "var(--accent)" }} />
        <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Du kannst <strong style={{ color: "var(--accent)" }}>mehrmals täglich</strong> wiegen.
          Für die Auswertung zählt der <strong style={{ color: "var(--accent)" }}>niedrigste Wert</strong>.
        </p>
      </div>

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <div className="mt-5 w-full">
          <p className="font-body mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Heute ({todayEntries.length} Messungen)
          </p>
          {todayEntries.map((e) => (
            <div key={e.id} className="mb-1.5 flex items-center justify-between rounded-xl p-3"
                 style={{
                   background: e.isLowest ? "color-mix(in srgb, var(--accent) 5%, var(--bg-card))" : "var(--bg-card)",
                   border: e.isLowest ? "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" : "1px solid var(--border)",
                 }}>
              <div>
                <p className="font-numbers text-base font-bold" style={{ color: "var(--text)" }}>{e.weight.toFixed(1)} kg</p>
                <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>{e.time}</p>
              </div>
              {e.isLowest && (
                <span className="font-body flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold"
                      style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
                  <Star size={10} /> Tageswert
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent days */}
      {recentDays.length > 0 && (
        <div className="mt-5 w-full">
          <p className="font-body mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Letzte Tage
          </p>
          {recentDays.slice(0, 5).map((e, i) => {
            const prev = recentDays[i + 1];
            const change = prev ? e.weight - prev.weight : 0;
            return (
              <div key={e.date} className="card mb-2 flex items-center justify-between p-3.5">
                <div>
                  <p className="font-numbers text-lg font-bold" style={{ color: "var(--text)" }}>{e.weight.toFixed(1)} kg</p>
                  <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                    {new Date(e.date).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
                {change !== 0 && (
                  <span className="font-body rounded-md px-2 py-1 text-xs font-semibold"
                        style={{
                          background: change < 0 ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--danger) 12%, transparent)",
                          color: change < 0 ? "var(--success)" : "var(--danger)",
                        }}>
                    {change > 0 ? "+" : ""}{change.toFixed(1)}
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
