import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim() || undefined,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

// Inicializa solo en cliente; en SSR no se usa Auth del navegador
const app = typeof window === "undefined" ? undefined : (!getApps().length ? initializeApp(firebaseConfig) : getApp());

// Log temporal para verificar proyecto del FRONT
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("🔥 Firebase FRONT projectId:", firebaseConfig.projectId);
}

export const auth = app ? getAuth(app) : undefined;
export const storage = app ? getStorage(app) : undefined;
export default app;


