import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Convert name to fake email for Firebase Auth (uses PIN as password)
function nameToEmail(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@10in10.app`;
}

export async function register(name: string, pin: string) {
  const email = nameToEmail(name);
  const cred = await createUserWithEmailAndPassword(auth, email, pin);
  await updateProfile(cred.user, { displayName: name });

  // Create user profile in Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    activityLevel: "light",
    createdAt: new Date().toISOString(),
  });

  // Create default privacy settings
  await setDoc(doc(db, "users", cred.user.uid, "settings", "privacy"), {
    weightVisible: true,
    caloriesVisible: true,
    activitiesVisible: false,
  });

  // Create default preferences
  await setDoc(doc(db, "users", cred.user.uid, "settings", "preferences"), {
    theme: "glass",
    fontSet: "prometo",
  });

  return cred.user;
}

export async function login(name: string, pin: string) {
  const email = nameToEmail(name);
  const cred = await signInWithEmailAndPassword(auth, email, pin);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
