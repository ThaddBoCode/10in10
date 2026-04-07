import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import {
  getMyTeams, getTeamDetail, createTeam, joinTeam,
  getPrivacy, updatePrivacy,
} from "../lib/firestore";
import {
  Users, Plus, Copy, Check, Lock, Unlock,
  X, Settings, UserPlus,
} from "lucide-react";

type TeamSummary = {
  id: string;
  name: string;
  inviteCode: string;
  targetKg: number;
  weeks: number;
  startDate: string;
  endDate: string;
};

type MemberProgress = {
  userId: string;
  name: string;
  role: string;
  isMe: boolean;
  weightLoss: number | null;
  currentWeight: number | null;
  privacyLevel: string;
};

type TeamDetail = {
  team: TeamSummary;
  members: MemberProgress[];
  teamTotalLoss: number;
  progressPct: number;
};

const medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

export default function TeamPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [copied, setCopied] = useState(false);

  // Privacy
  const [privacyWeight, setPrivacyWeight] = useState(true);
  const [privacyCalories, setPrivacyCalories] = useState(true);
  const [privacyActivities, setPrivacyActivities] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Create form
  const [teamName, setTeamName] = useState("");
  const [teamTarget, setTeamTarget] = useState("30");
  const [teamWeeks, setTeamWeeks] = useState("10");

  // Join form
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const loadTeams = useCallback(async () => {
    if (!user) return;
    const t = await getMyTeams(user.uid);
    const teamList = (t || []) as TeamSummary[];
    setTeams(teamList);
    if (teamList.length > 0 && !activeTeamId) {
      setActiveTeamId(teamList[0].id);
    }
  }, [user, activeTeamId]);

  const loadTeamDetail = useCallback(async (id: string) => {
    if (!user) return;
    const data = await getTeamDetail(id, user.uid);
    if (data) setTeamDetail(data as unknown as TeamDetail);
  }, [user]);

  const loadPrivacy = useCallback(async () => {
    if (!user) return;
    const settings = await getPrivacy(user.uid);
    if (settings) {
      setPrivacyWeight(settings.weightVisible !== false);
      setPrivacyCalories(settings.caloriesVisible !== false);
      setPrivacyActivities(settings.activitiesVisible === true);
    }
  }, [user]);

  useEffect(() => { loadTeams(); loadPrivacy(); }, [loadTeams, loadPrivacy]);

  useEffect(() => {
    if (activeTeamId) loadTeamDetail(activeTeamId);
  }, [activeTeamId, loadTeamDetail]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createTeam(user.uid, teamName, parseFloat(teamTarget), parseInt(teamWeeks));
    setShowCreate(false);
    setTeamName("");
    loadTeams();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setJoinError("");
    try {
      await joinTeam(user.uid, joinCode);
      setShowJoin(false);
      setJoinCode("");
      loadTeams();
    } catch (err: any) {
      setJoinError(err.message || "Fehler beim Beitreten");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrivacySave = async () => {
    if (!user) return;
    await updatePrivacy(user.uid, {
      weightVisible: privacyWeight,
      caloriesVisible: privacyCalories,
      activitiesVisible: privacyActivities,
    });
    setShowPrivacy(false);
    if (activeTeamId) loadTeamDetail(activeTeamId);
  };

  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const currentWeek = activeTeam
    ? Math.min(Math.floor((Date.now() - new Date(activeTeam.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1, activeTeam.weeks)
    : 1;

  return (
    <div className="pt-6">
      <div className="px-5">
        <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>Team Challenge</p>
        <h1 className="font-heading text-[26px]" style={{ color: "var(--text)" }}>Zusammen stark</h1>
      </div>

      {/* Team Selector */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {teams.map((t) => (
          <button key={t.id} onClick={() => setActiveTeamId(t.id)}
            className="font-body whitespace-nowrap rounded-[14px] px-5 py-2.5 text-[13px] font-semibold transition-all"
            style={{
              background: activeTeamId === t.id ? "var(--primary)" : "transparent",
              color: activeTeamId === t.id ? "white" : "var(--text-secondary)",
              border: `2px solid ${activeTeamId === t.id ? "var(--primary)" : "var(--border)"}`,
            }}>
            {t.name}
          </button>
        ))}
        <button onClick={() => setShowCreate(true)}
          className="font-body flex items-center gap-1 whitespace-nowrap rounded-[14px] px-4 py-2.5 text-[13px] font-semibold"
          style={{ border: "2px dashed var(--border)", color: "var(--text-muted)" }}>
          <Plus size={14} /> Neues Team
        </button>
        <button onClick={() => setShowJoin(true)}
          className="font-body flex items-center gap-1 whitespace-nowrap rounded-[14px] px-4 py-2.5 text-[13px] font-semibold"
          style={{ border: "2px dashed var(--border)", color: "var(--text-muted)" }}>
          <UserPlus size={14} /> Beitreten
        </button>
      </div>

      {/* No teams */}
      {teams.length === 0 && !showCreate && !showJoin && (
        <div className="card mx-5 mt-6 flex flex-col items-center p-10">
          <Users size={48} style={{ color: "var(--text-muted)" }} />
          <p className="font-body mt-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Erstelle ein Team oder tritt einem bei.
          </p>
        </div>
      )}

      {/* Team Goal Card */}
      {teamDetail && activeTeam && (
        <>
          <div className="mx-5 mt-4 overflow-hidden p-6 relative"
               style={{ background: "var(--gradient-primary)", borderRadius: "var(--card-radius)" }}>
            <div className="absolute -bottom-10 -right-5 h-[140px] w-[140px] rounded-full bg-white/[0.08]" />
            <p className="font-body relative text-[11px] font-bold uppercase tracking-[1.5px] text-white/80">
              Gemeinsames Ziel: {activeTeam.name}
            </p>
            <p className="font-numbers relative mt-1 text-[40px] leading-tight text-white">
              -{teamDetail.teamTotalLoss} kg
            </p>
            <p className="font-body relative text-[13px] text-white/75">
              von {activeTeam.targetKg} kg zusammen &bull; {teamDetail.members.length} Teilnehmer &bull; Woche {currentWeek}/{activeTeam.weeks}
            </p>
            <div className="relative mt-3.5 h-[6px] overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white/85 transition-all duration-1000"
                   style={{ width: `${teamDetail.progressPct}%` }} />
            </div>
          </div>

          {/* Team Settings + Invite */}
          <div className="mx-5 mt-3 flex gap-2">
            <div className="card flex-1 p-3.5">
              <p className="font-body mb-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Einladungscode
              </p>
              <div className="flex items-center justify-between">
                <p className="font-numbers text-xl tracking-[4px]" style={{ color: "var(--primary-light)" }}>
                  {activeTeam.inviteCode}
                </p>
                <button onClick={() => handleCopyCode(activeTeam.inviteCode)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}>
                  {copied ? <Check size={14} style={{ color: "var(--success)" }} /> : <Copy size={14} style={{ color: "var(--primary-light)" }} />}
                </button>
              </div>
            </div>
            <button onClick={() => setShowPrivacy(true)}
              className="card flex w-14 flex-col items-center justify-center gap-1 p-3.5"
              style={{ cursor: "pointer" }}>
              <Settings size={18} style={{ color: "var(--text-muted)" }} />
              <span className="font-body text-[8px]" style={{ color: "var(--text-muted)" }}>Privacy</span>
            </button>
          </div>

          {/* Rangliste */}
          <div className="mt-5 flex items-center justify-between px-5">
            <h2 className="font-heading text-lg" style={{ color: "var(--text)" }}>Rangliste</h2>
          </div>

          {teamDetail.members.map((m, i) => (
            <div key={m.userId} className="card mx-5 mt-2 flex items-center gap-3.5 p-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold"
                   style={{
                     background: i < 3 ? "var(--gradient-primary)" : "var(--bg-input, var(--border))",
                     color: i < 3 ? "white" : "var(--text-muted)",
                   }}>
                {i < 3 ? medals[i] : i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-heading text-[15px]" style={{ color: "var(--text)" }}>
                    {m.name}{m.isMe ? " (Du)" : ""}
                  </p>
                  <p className="font-numbers text-base font-bold" style={{ color: "var(--success)" }}>
                    {m.weightLoss !== null ? `-${m.weightLoss} kg` : "—"}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {m.currentWeight !== null && (
                    <span className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                      {m.currentWeight} kg
                    </span>
                  )}
                  <span className="font-body ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: m.privacyLevel === "open"
                            ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                            : "color-mix(in srgb, var(--text-muted) 12%, transparent)",
                          color: m.privacyLevel === "open" ? "var(--primary-light)" : "var(--text-muted)",
                        }}>
                    {m.privacyLevel === "open" ? <Unlock size={9} /> : <Lock size={9} />}
                    {m.privacyLevel === "open" ? "Offen" : "Privat"}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all"
                       style={{
                         width: `${activeTeam.targetKg > 0 && m.weightLoss ? Math.min(((m.weightLoss) / (activeTeam.targetKg / teamDetail.members.length)) * 100, 100) : 0}%`,
                         background: "var(--gradient-primary)",
                       }} />
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Create Team Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-[600px] rounded-t-3xl p-6 pb-10"
               style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg" style={{ color: "var(--text)" }}>Team erstellen</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="font-body mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Teamname</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="z.B. Abnehm-Crew"
                  className="font-body w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-body mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Gemeinsames Ziel (kg)</label>
                  <input type="number" value={teamTarget} onChange={(e) => setTeamTarget(e.target.value)}
                    className="font-numbers w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="font-body mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Wochen</label>
                  <input type="number" value={teamWeeks} onChange={(e) => setTeamWeeks(e.target.value)}
                    className="font-numbers w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
              </div>
              <button type="submit"
                className="font-heading flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
                <Users size={18} /> Team erstellen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-[600px] rounded-t-3xl p-6 pb-10"
               style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg" style={{ color: "var(--text)" }}>Team beitreten</h2>
              <button onClick={() => setShowJoin(false)}><X size={20} style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <label className="font-body mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Einladungscode</label>
                <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Z.B. XK7M2P" maxLength={6}
                  className="font-numbers w-full rounded-xl px-4 py-4 text-center text-2xl tracking-[8px] outline-none uppercase"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--primary-light)" }} />
              </div>
              {joinError && (
                <p className="font-body text-center text-sm" style={{ color: "var(--danger)" }}>{joinError}</p>
              )}
              <button type="submit"
                className="font-heading flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-white"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
                <UserPlus size={18} /> Beitreten
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-[600px] rounded-t-3xl p-6 pb-10"
               style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg" style={{ color: "var(--text)" }}>Datenschutz</h2>
              <button onClick={() => setShowPrivacy(false)}><X size={20} style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <p className="font-body mb-4 text-xs" style={{ color: "var(--text-secondary)" }}>
              Bestimme, was dein Team sehen darf. Bei &quot;Privat&quot; sieht das Team nur deinen Gesamtfortschritt in Prozent.
            </p>
            {[
              { label: "Gewicht sichtbar", desc: "Aktuelles Gewicht und Verlauf", value: privacyWeight, set: setPrivacyWeight },
              { label: "Kalorien sichtbar", desc: "Kalorienverbrauch", value: privacyCalories, set: setPrivacyCalories },
              { label: "Trainings sichtbar", desc: "Einzelne Aktivitaeten", value: privacyActivities, set: setPrivacyActivities },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p className="font-body text-[15px]" style={{ color: "var(--text)" }}>{item.label}</p>
                  <p className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </div>
                <button onClick={() => item.set(!item.value)}
                  className="relative h-7 w-12 rounded-full transition-colors"
                  style={{ background: item.value ? "var(--success)" : "var(--border)" }}>
                  <div className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all"
                       style={{ left: item.value ? "23px" : "3px" }} />
                </button>
              </div>
            ))}
            <button onClick={handlePrivacySave}
              className="font-heading mt-4 w-full rounded-xl py-3 text-base font-bold text-white"
              style={{ background: "var(--gradient-primary)" }}>
              Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
