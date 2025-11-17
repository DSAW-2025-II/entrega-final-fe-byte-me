// front/app/lib/loginGoogle.ts
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { app } from "./firebase";

const provider = new GoogleAuthProvider();
const auth = getAuth(app);

export async function loginGoogle() {
  const r = await signInWithPopup(auth, provider);
  const idToken = await r.user.getIdToken();

  const res = await fetch("https://move-together2-back.vercel.app/api/auth/login-google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
