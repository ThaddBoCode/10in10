import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  query, where, orderBy, limit, updateDoc, serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

// =================== WEIGHT ===================
export async function addWeight(userId: string, weight: number) {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].slice(0, 5);

  const ref = await addDoc(collection(db, "users", userId, "weights"), {
    weight, date, time, createdAt: serverTimestamp(),
  });

  // Recalculate isLowest for today
  await recalcLowest(userId, date);
  return ref.id;
}

async function recalcLowest(userId: string, date: string) {
  const q = query(
    collection(db, "users", userId, "weights"),
    where("date", "==", date),
    orderBy("weight", "asc")
  );
  const snap = await getDocs(q);
  let first = true;
  for (const d of snap.docs) {
    await updateDoc(d.ref, { isLowest: first });
    first = false;
  }
}

export async function getTodayWeights(userId: string) {
  const date = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "users", userId, "weights"),
    where("date", "==", date),
    orderBy("time", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getWeights(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const q = query(
    collection(db, "users", userId, "weights"),
    where("isLowest", "==", true),
    where("date", ">=", sinceStr),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// =================== GOALS ===================
export async function createGoal(userId: string, startWeight: number, targetWeight: number, weeks: number) {
  const startDate = new Date().toISOString();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + weeks * 7);

  const ref = await addDoc(collection(db, "goals"), {
    userId, startWeight, targetWeight, weeks,
    startDate, endDate: endDate.toISOString(),
    isActive: true, createdAt: serverTimestamp(),
  });

  // Save initial weight entry
  await addWeight(userId, startWeight);
  return ref.id;
}

export async function getActiveGoal(userId: string) {
  const q = query(
    collection(db, "goals"),
    where("userId", "==", userId),
    where("isActive", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// =================== ACTIVITIES ===================
export async function addActivity(userId: string, data: {
  type: string; name: string; duration: number;
  calories?: number; distance?: number;
}) {
  const calories = data.calories || Math.round((data.duration / 10) * 70);
  return addDoc(collection(db, "users", userId, "activities"), {
    ...data, calories,
    date: new Date().toISOString(),
    duration: data.duration * 60,
    source: "manual",
    createdAt: serverTimestamp(),
  });
}

export async function getActivities(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const q = query(
    collection(db, "users", userId, "activities"),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a: DocumentData) => new Date(a.date) >= since);
}

// =================== TEAMS ===================
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createTeam(userId: string, name: string, targetKg: number, weeks: number) {
  const inviteCode = generateInviteCode();
  const startDate = new Date().toISOString();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + weeks * 7);

  const ref = await addDoc(collection(db, "teams"), {
    name, inviteCode, targetKg, weeks,
    startDate, endDate: endDate.toISOString(),
    createdById: userId,
    memberIds: [userId],
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "teams", ref.id, "members", userId), {
    role: "admin", joinedAt: serverTimestamp(),
  });

  return { id: ref.id, inviteCode };
}

export async function joinTeam(userId: string, code: string) {
  const q = query(collection(db, "teams"), where("inviteCode", "==", code.toUpperCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Team nicht gefunden");

  const teamDoc = snap.docs[0];
  const teamData = teamDoc.data();

  if (teamData.memberIds?.includes(userId)) throw new Error("Bereits Mitglied");

  await updateDoc(teamDoc.ref, { memberIds: [...(teamData.memberIds || []), userId] });
  await setDoc(doc(db, "teams", teamDoc.id, "members", userId), {
    role: "member", joinedAt: serverTimestamp(),
  });

  return { id: teamDoc.id, name: teamData.name };
}

export async function getMyTeams(userId: string) {
  const q = query(collection(db, "teams"), where("memberIds", "array-contains", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getTeamDetail(teamId: string, currentUserId: string) {
  const teamDoc = await getDoc(doc(db, "teams", teamId));
  if (!teamDoc.exists()) return null;
  const team = { id: teamDoc.id, ...teamDoc.data() } as DocumentData;

  const membersSnap = await getDocs(collection(db, "teams", teamId, "members"));
  const members = [];

  for (const m of membersSnap.docs) {
    const uid = m.id;
    const memberData = m.data();
    const userDoc = await getDoc(doc(db, "users", uid));
    const userData = userDoc.exists() ? userDoc.data() : { name: "Unknown" };

    // Get privacy
    const privDoc = await getDoc(doc(db, "users", uid, "settings", "privacy"));
    const privacy = privDoc.exists() ? privDoc.data() : { weightVisible: true, caloriesVisible: true };
    const isMe = uid === currentUserId;
    const showWeight = isMe || privacy.weightVisible !== false;

    // Get weight loss
    let weightLoss = 0;
    let currentWeight = null;
    if (showWeight) {
      const wq = query(collection(db, "users", uid, "weights"), where("isLowest", "==", true), orderBy("date", "desc"), limit(1));
      const wSnap = await getDocs(wq);
      if (!wSnap.empty) {
        currentWeight = wSnap.docs[0].data().weight;
        const firstQ = query(collection(db, "users", uid, "weights"), where("isLowest", "==", true), orderBy("date", "asc"), limit(1));
        const firstSnap = await getDocs(firstQ);
        if (!firstSnap.empty) {
          weightLoss = Math.round((firstSnap.docs[0].data().weight - currentWeight) * 10) / 10;
        }
      }
    }

    members.push({
      userId: uid, name: userData.name, role: memberData.role, isMe,
      weightLoss: showWeight ? weightLoss : null,
      currentWeight: showWeight ? currentWeight : null,
      privacyLevel: showWeight ? "open" : "private",
    });
  }

  members.sort((a, b) => (b.weightLoss || 0) - (a.weightLoss || 0));
  const teamTotalLoss = members.reduce((s, m) => s + (m.weightLoss || 0), 0);

  return {
    team, members,
    teamTotalLoss: Math.round(teamTotalLoss * 10) / 10,
    progressPct: team.targetKg > 0 ? Math.min((teamTotalLoss / team.targetKg) * 100, 100) : 0,
  };
}

// =================== PRIVACY ===================
export async function getPrivacy(userId: string) {
  const d = await getDoc(doc(db, "users", userId, "settings", "privacy"));
  return d.exists() ? d.data() : { weightVisible: true, caloriesVisible: true, activitiesVisible: false };
}

export async function updatePrivacy(userId: string, settings: Record<string, boolean>) {
  await setDoc(doc(db, "users", userId, "settings", "privacy"), settings);
}

// =================== STREAK ===================
export async function getStreak(userId: string) {
  const q = query(collection(db, "users", userId, "weights"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  const dates = [...new Set(snap.docs.map((d) => d.data().date as string))];

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const check = new Date(today);
    check.setDate(check.getDate() - i);
    const dateStr = check.toISOString().split("T")[0];
    if (dates.includes(dateStr)) { streak++; }
    else if (i === 0) { continue; }
    else { break; }
  }

  const weekDays = [];
  const mondayOffset = (today.getDay() + 6) % 7;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - mondayOffset + i);
    const dateStr = d.toISOString().split("T")[0];
    weekDays.push({
      label: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][i],
      logged: dates.includes(dateStr),
      isToday: dateStr === today.toISOString().split("T")[0],
    });
  }

  return { streak, weekDays };
}
