"use client";
import { loginGoogle } from "../lib/loginGoogle";

export default function ButtonGoogle() {
  return (
    <button onClick={loginGoogle} className="border p-2 rounded">
      Iniciar sesión con Google
    </button>
  );
}
