"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import ButtonBlack from "@/components/ButtonBlack";
import ButtonOutline from "@/components/ButtonOutline";
import ButtonGoogle from "@/components/ButtonGoogle";

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
    setLoading(true);

    try {
      const result = await api.post("/api/auth/login", {
        email: email.trim(),
        password: pass,
      });

      // Guardar el token
      if (result.idToken) {
        localStorage.setItem("idToken", result.idToken);
        if (result.refreshToken) {
          localStorage.setItem("refreshToken", result.refreshToken);
        }
      }

      setOk("Login exitoso");
      await delay(800);
      setOk("");
      router.push("/dashboard");
    } catch (e: any) {
      const errorMessage = e.message || "Error al iniciar sesión";
      if (errorMessage.includes("Usuario no encontrado")) {
        setErr("Usuario no encontrado");
      } else if (errorMessage.includes("Contraseña incorrecta")) {
        setErr("Contraseña incorrecta");
      } else {
        setErr(errorMessage);
      }
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

      // Verificar si el correo ya existe
      try {
        await api.post("/api/auth/login", {
          email: mail,
          password: "dummy",
        });
        setErr("El correo ya está registrado. Inicia sesión.");
      } catch (e: any) {
        if (e.message?.includes("Usuario no encontrado")) {
          router.push(`/create-user?email=${encodeURIComponent(mail)}&from=email`);
        } else {
          setErr("El correo ya está registrado. Inicia sesión.");
        }
      }
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
      const { auth, googleProvider } = await import("@/lib/firebase");

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);

      // Verificar con el backend
      const backendResult = await api.post("/api/auth/google", {}, idToken);

      if (backendResult.user) {
        localStorage.setItem("idToken", idToken);
        
        // Verificar si es un usuario nuevo
        const checkResult = await api.post("/api/auth/ensure-user", {}, idToken);
        
        if (checkResult.created === true) {
          router.push(`/create-user?from=google&uid=${backendResult.user.uid}&email=${backendResult.user.email}&name=${backendResult.user.name || ""}&photo=${backendResult.user.picture || ""}`);
        } else {
          router.push("/dashboard");
        }
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
              Forgot Your Password?
            </button>
          </div>
        </div>

        {/* DERECHA - IMAGEN */}
        {!isMobile && (
          <div style={S.rightPane}>
            <div
              style={{
                ...S.hero,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            />
            <div style={S.overlay} />
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
  },
  rightPane: {
    position: "relative" as const,
  },
  hero: {
    position: "absolute" as const,
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  overlay: {
    position: "absolute" as const,
    inset: 0,
    background: "rgba(0,0,0,0.25)",
  },
  formCard: {
    display: "grid",
    gap: 12,
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

