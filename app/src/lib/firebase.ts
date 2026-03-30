import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOErzRV_f7g3lVJVxGfbZQNG5bpd240CI",
  authDomain: "in10-66bbb.firebaseapp.com",
  projectId: "in10-66bbb",
  storageBucket: "in10-66bbb.firebasestorage.app",
  messagingSenderId: "84147309183",
  appId: "1:84147309183:web:9618ed24bd886cd3074d4a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
