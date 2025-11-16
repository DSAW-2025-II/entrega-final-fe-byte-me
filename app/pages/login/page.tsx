"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { saveToken, ensureValidToken } from "@/lib/auth";
import ButtonBlack from "@/components/ButtonBlack";
import ButtonOutline from "@/components/ButtonOutline";
import ButtonGoogle from "@/components/ButtonGoogle";
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth as clientAuth } from "@/lib/firebaseClient";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loginEmail = async () => {
    setErr("");
    setOk("");
    
    // Validar formato de email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErr("Ingresa un correo electrónico");
      return;
    }
    
    if (!trimmedEmail.endsWith("@unisabana.edu.co")) {
      setErr("Solo se permiten correos de @unisabana.edu.co");
      return;
    }
    
    if (!pass) {
      setErr("Ingresa tu contraseña");
      return;
    }
    
    setLoading(true);

    try {
      // Login 100% con Firebase en el FRONT y error genérico
      if (!clientAuth) throw new Error("Config de Firebase ausente. Revisa NEXT_PUBLIC_*");
      await signInWithEmailAndPassword(clientAuth, trimmedEmail, pass);
      router.push("/pages/login/landing");
    } catch (e: any) {
      console.error("Firebase login error:", e);
      setErr("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const goCreateUser = async () => {
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const mail = email.trim();
      if (!mail) {
        throw new Error("Ingresa un correo institucional");
      }

      // Verificar métodos de autenticación disponibles para el email
      // Usar Firebase Auth REST API para verificar si el email existe
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) {
        throw new Error("Firebase no está configurado correctamente");
      }

      // Verificar si el email ya está registrado
      const checkUrl = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`;
      const checkResponse = await fetch(checkUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: mail, continueUri: "http://localhost" }),
      });

      const checkData = await checkResponse.json();

      if (checkData.registered === true) {
        setErr("El correo ya está registrado. Inicia sesión.");
        return;
      }

      // Si no está registrado, redirigir a crear cuenta
      router.push(`/pages/create-user?email=${encodeURIComponent(mail)}&from=email`);
    } catch (e: any) {
      setErr(e.message || "No se pudo verificar el correo");
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    setErr("");
    setOk("");
    setGLoading(true);

    try {
      // Usar Firebase Auth para autenticación con Google
      const { signInWithPopup } = await import("firebase/auth");
      const firebaseModule = await import("@/lib/firebase");
      const { initializeFirebase } = firebaseModule;

      // Asegurar que Firebase esté inicializado
      initializeFirebase();
      
      // Esperar un momento para que Firebase se inicialice
      await delay(200);
      
      // Re-importar para obtener las instancias actualizadas después de la inicialización
      const { auth, googleProvider } = await import("@/lib/firebase");

      if (!auth || !googleProvider) {
        // Intentar una vez más
        initializeFirebase();
        await delay(300);
        const { auth: authRetry, googleProvider: providerRetry } = await import("@/lib/firebase");
        if (!authRetry || !providerRetry) {
          throw new Error("Firebase no está inicializado. Verifica las variables de entorno y recarga la página.");
        }
        const result = await signInWithPopup(authRetry, providerRetry);
        const idToken = await result.user.getIdToken(true);
        
        // Continuar con el flujo usando authRetry
        const backendResult = await api.post("/api/auth/google", {}, idToken);
        if (!backendResult.user) {
          throw new Error("No se pudo verificar la autenticación con Google");
        }
        saveToken(idToken);
        const validToken = await ensureValidToken();
        if (!validToken) {
          throw new Error("No se pudo validar la sesión. Intenta nuevamente.");
        }
        const userCheck = await api.post("/api/auth/ensure-user", {}, validToken);
        if (userCheck.created === true) {
          const user = result.user;
          const params = new URLSearchParams({
            from: "google",
            uid: user.uid,
            email: user.email || "",
            name: user.displayName || "",
            photo: user.photoURL || "",
          });
          router.push(`/pages/create-user?${params.toString()}`);
        } else {
          router.push("/pages/login/landing");
        }
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);

      // Verificar con el backend que el token de Google sea válido
      const backendResult = await api.post("/api/auth/google", {}, idToken);

      if (!backendResult.user) {
        throw new Error("No se pudo verificar la autenticación con Google");
      }

      // Guardar el token temporal
      saveToken(idToken);
      
      // Verificar que el token sea válido
      const validToken = await ensureValidToken();
      if (!validToken) {
        throw new Error("No se pudo validar la sesión. Intenta nuevamente.");
      }

      // Verificar si el usuario existe en Firestore
      const userCheck = await api.post("/api/auth/ensure-user", {}, validToken);
      
      if (userCheck.created === true) {
        // Usuario nuevo - redirigir a crear usuario con datos de Google
        const user = result.user;
        const params = new URLSearchParams({
          from: "google",
          uid: user.uid,
          email: user.email || "",
          name: user.displayName || "",
          photo: user.photoURL || "",
        });
        router.push(`/pages/create-user?${params.toString()}`);
      } else {
        // Usuario existente - redirigir a landing page
        router.push("/pages/login/landing");
      }
    } catch (e: any) {
      if (e.code !== "auth/popup-closed-by-user") {
        setErr(e.message || "Error con Google");
      }
    } finally {
      setGLoading(false);
    }
  };

  return (
    <div style={S.shell}>
      <div
        style={{
          ...S.canvas,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          maxWidth: 1280,
          maxHeight: 832,
          width: "100%",
          height: "100%",
        }}
      >
        {/* IZQUIERDA - FORMULARIO */}
        <div style={{ ...S.leftPane, padding: isMobile ? 20 : 32 }}>
          <div style={{ ...S.formCard, width: isMobile ? "100%" : 420 }}>
            <h1 style={{ ...S.title, fontSize: isMobile ? 28 : 36 }}>
              Iniciar sesión
            </h1>

            <label style={S.label}>Correo</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="email"
              placeholder="correo@unisabana.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <label style={S.label}>Contraseña</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />

        {/* Olvidé mi contraseña */}
        <button
          type="button"
          onClick={() => router.push("/recover-password")}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            marginTop: 6,
            color: "#0126B9",
            fontSize: 14,
            textAlign: "left",
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>

            {err && <div style={S.error}>{err}</div>}
            {ok && <div style={S.success}>{ok}</div>}

            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <ButtonBlack onClick={loginEmail} disabled={loading || gLoading}>
                {loading ? "Cargando..." : "Entrar"}
              </ButtonBlack>

              <ButtonOutline onClick={goCreateUser} disabled={loading || gLoading}>
                Crear cuenta
              </ButtonOutline>

              <ButtonGoogle onClick={loginGoogle} disabled={loading || gLoading}>
                {gLoading ? "Conectando..." : "Continuar con Google"}
              </ButtonGoogle>
            </div>

            {/* Forgot password */}
            <button
              type="button"
              onClick={() => router.push("/recover-password")}
              style={S.forgot}
            >
              Recover password
            </button>
          </div>
        </div>

        {/* DERECHA - IMAGEN */}
        {!isMobile && (
          <div style={S.rightPane}>
            <div style={S.imageContainer}>
              <Image
                src="/Group27.png"
                alt="Ilustración de autos y ciudad"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------ ESTILOS ------------------ */
const S = {
  shell: {
    width: "100vw",
    height: "100vh",
    background: "#f5f6f8",
    display: "grid",
    placeItems: "center",
  },
  canvas: {
    position: "relative" as const,
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
    display: "grid",
  },
  leftPane: {
    display: "grid",
    placeItems: "center",
    position: "relative" as const,
    zIndex: 1,
  },
  rightPane: {
    position: "relative" as const,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative" as const,
    width: "100%",
    height: "100%",
  },
  formCard: {
    display: "grid",
    gap: 12,
    position: "relative" as const,
    zIndex: 2,
  },
  title: {
    margin: 0,
    fontWeight: 800,
    color: "#111",
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginTop: 8,
  },
  input: {
    border: "1px solid #dedede",
    borderRadius: 10,
    padding: "0 14px",
    fontSize: 16,
    background: "#fff",
    color: "#111827",
    position: "relative" as const,
    zIndex: 1,
    pointerEvents: "auto" as const,
  },
  error: {
    background: "#ffeef0",
    color: "#b00020",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
  },
  success: {
    background: "#e6ffed",
    color: "#056f00",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
  },
  forgot: {
    marginTop: 10,
    background: "transparent",
    border: "none",
    padding: 0,
    color: "#0126B9",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    width: "fit-content",
  },
};

