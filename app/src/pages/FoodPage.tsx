import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import { addMeal, getTodayMeals, deleteMeal } from "../lib/firestore";
import { X, Trash2 } from "lucide-react";

type Meal = { id: string; name: string; calories: number; category: string; time: string };

const PRESETS: Record<string, { name: string; cal: number }[]> = {
  "Getränke": [
    { name: "Wasser", cal: 0 },
    { name: "Kaffee schwarz", cal: 2 },
    { name: "Kaffee mit Milch", cal: 20 },
    { name: "Kaffee mit Milch + Zucker", cal: 50 },
    { name: "Tee", cal: 2 },
    { name: "Tee mit Honig", cal: 45 },
    { name: "Cola / Limo", cal: 140 },
    { name: "Saft", cal: 120 },
    { name: "Bier 0,5l", cal: 210 },
    { name: "Wein 0,2l", cal: 160 },
  ],
  "Frühstück": [
    { name: "Müsli mit Milch", cal: 350 },
    { name: "Brot mit Käse", cal: 250 },
    { name: "Brot mit Wurst", cal: 280 },
    { name: "Brot mit Marmelade", cal: 220 },
    { name: "Joghurt mit Obst", cal: 200 },
    { name: "Croissant", cal: 270 },
    { name: "Ei gekocht", cal: 80 },
    { name: "Rührei (2 Eier)", cal: 200 },
  ],
  "Mittag / Abend": [
    { name: "Kebab / Döner", cal: 650 },
    { name: "Pizza", cal: 800 },
    { name: "Salat mit Dressing", cal: 350 },
    { name: "Pasta Bolognese", cal: 550 },
    { name: "Reis mit Fleisch", cal: 500 },
    { name: "Suppe", cal: 250 },
    { name: "Burger + Pommes", cal: 900 },
    { name: "Schnitzel + Beilage", cal: 700 },
    { name: "Sushi (10 Stück)", cal: 400 },
    { name: "Brot mit Aufschnitt", cal: 300 },
    { name: "Warme Mahlzeit (klein)", cal: 400 },
    { name: "Warme Mahlzeit (gross)", cal: 700 },
  ],
  "Snacks": [
    { name: "Apfel / Birne", cal: 60 },
    { name: "Banane", cal: 90 },
    { name: "Schokolade Riegel", cal: 250 },
    { name: "Chips Tüte", cal: 500 },
    { name: "Nüsse Handvoll", cal: 180 },
    { name: "Keks / Kekse", cal: 150 },
    { name: "Eis (1 Kugel)", cal: 120 },
    { name: "Kuchen (1 Stück)", cal: 350 },
  ],
};

export default function FoodPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Getränke");
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const m = await getTodayMeals(user.uid);
    setMeals(m as Meal[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (name: string, cal: number, category: string) => {
    if (!user) return;
    await addMeal(user.uid, name, cal, category);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteMeal(user.uid, id);
    load();
  };

  const handleCustom = () => {
    if (!customName || !customCal) return;
    handleAdd(customName, parseInt(customCal), "Eigene");
    setCustomName("");
    setCustomCal("");
  };

  const totalCal = meals.reduce((s, m) => s + m.calories, 0);

  return (
    <div className="pt-6">
      <div className="px-5">
        <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>Ernährung</p>
        <h1 className="font-heading text-[24px]" style={{ color: "var(--text)" }}>Heute gegessen</h1>
      </div>

      {/* Tages-Summe */}
      <div className="card" style={{ margin: "12px 20px", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="font-body" style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Kalorien heute</div>
          <div className="font-numbers" style={{ fontSize: 32, fontWeight: 500, color: "var(--danger)", marginTop: 2 }}>{totalCal.toLocaleString("de-DE")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="font-body" style={{ fontSize: 11, color: "var(--text-muted)" }}>{meals.length} Einträge</div>
          <button onClick={() => setShowAdd(true)}
            className="font-heading" style={{ marginTop: 6, padding: "8px 16px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            + Hinzufügen
          </button>
        </div>
      </div>

      {/* Heutige Einträge */}
      {meals.length === 0 && (
        <div className="card" style={{ margin: "8px 20px", padding: "32px 16px", textAlign: "center" }}>
          <p className="font-body" style={{ fontSize: 14, color: "var(--text-muted)" }}>Noch nichts eingetragen</p>
          <button onClick={() => setShowAdd(true)}
            className="font-body" style={{ marginTop: 12, padding: "10px 20px", borderRadius: 10, background: "var(--primary)", color: "white", border: "none", fontSize: 13, cursor: "pointer" }}>
            Erste Mahlzeit eintragen
          </button>
        </div>
      )}

      {meals.map((m) => (
        <div key={m.id} className="card" style={{ margin: "4px 20px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span className="font-body" style={{ fontSize: 14, color: "var(--text)" }}>{m.name}</span>
            <span className="font-body" style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{m.time}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="font-numbers" style={{ fontSize: 14, fontWeight: 500, color: "var(--danger)" }}>{m.calories}</span>
            <button onClick={() => handleDelete(m.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Trash2 size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </div>
      ))}

      {/* Hinzufügen Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 600, maxHeight: "85vh", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", background: "var(--bg)", border: "1px solid var(--border)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 className="font-heading" style={{ fontSize: 18, color: "var(--text)" }}>Mahlzeit hinzufügen</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} style={{ color: "var(--text-muted)" }} /></button>
            </div>

            {/* Kategorie Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto" }} className="no-sb">
              {Object.keys(PRESETS).map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="font-body" style={{
                    padding: "6px 14px", borderRadius: 10, whiteSpace: "nowrap", fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none",
                    background: activeCategory === cat ? "var(--primary)" : "var(--bg-card)",
                    color: activeCategory === cat ? "white" : "var(--text-secondary)",
                  }}>{cat}</button>
              ))}
            </div>

            {/* Preset Items */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {PRESETS[activeCategory]?.map((item) => (
                <button key={item.name} onClick={() => { handleAdd(item.name, item.cal, activeCategory); }}
                  className="card" style={{ padding: "10px 12px", textAlign: "left", cursor: "pointer", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                  <div className="font-body" style={{ fontSize: 12, color: "var(--text)" }}>{item.name}</div>
                  <div className="font-numbers" style={{ fontSize: 14, fontWeight: 500, color: "var(--primary)", marginTop: 2 }}>{item.cal} kcal</div>
                </button>
              ))}
            </div>

            {/* Eigener Eintrag */}
            <div style={{ marginTop: 16, padding: 12, borderRadius: 14, background: "color-mix(in srgb, var(--primary) 5%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 10%, transparent)" }}>
              <div className="font-body" style={{ fontSize: 11, fontWeight: 500, color: "var(--primary-light)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Eigener Eintrag</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Name"
                  className="font-body" style={{ flex: 2, padding: "8px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, outline: "none" }} />
                <input value={customCal} onChange={(e) => setCustomCal(e.target.value)} placeholder="kcal" type="number"
                  className="font-numbers" style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, outline: "none" }} />
                <button onClick={handleCustom}
                  style={{ padding: "8px 14px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>+</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
