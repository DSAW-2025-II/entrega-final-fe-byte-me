"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
      const result = await api.post("/api/auth/login", {
        email: trimmedEmail,
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
      router.push("/pages/login/landing");
    } catch (e: any) {
      const errorMessage = e.message || "Error al iniciar sesión";
      
      // Manejar diferentes tipos de errores
      if (errorMessage.includes("Usuario no encontrado") || errorMessage.includes("EMAIL_NOT_FOUND")) {
        // Si el usuario no está registrado, redirigir automáticamente a registro
        setErr("");
        router.push(`/create-user?email=${encodeURIComponent(trimmedEmail)}&from=login&blocked=true`);
        return;
      } else if (errorMessage.includes("Contraseña incorrecta") || errorMessage.includes("INVALID_PASSWORD")) {
        setErr("Contraseña incorrecta");
      } else if (errorMessage.includes("INVALID_LOGIN_CREDENTIALS")) {
        // Firebase puede devolver INVALID_LOGIN_CREDENTIALS para ambos casos
        // Necesitamos verificar si el email existe
        try {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
          if (apiKey) {
            const checkUrl = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`;
            const checkResponse = await fetch(checkUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                identifier: trimmedEmail, 
                continueUri: "http://localhost" 
              }),
            });
            
            const checkData = await checkResponse.json();
            
            // Log para debug
            console.log("Verificación de email:", checkData);
            
            // Verificar si el email está registrado
            // Firebase puede devolver diferentes formatos de respuesta
            const hasEmailNotFound = checkData.error?.message === "EMAIL_NOT_FOUND" || 
                                     checkData.error?.message?.includes("EMAIL_NOT_FOUND") ||
                                     checkData.error?.code === 400;
            
            // Verificar si hay signInMethods (si existe, el email está registrado)
            const hasSignInMethods = checkData.signinMethods && Array.isArray(checkData.signinMethods) && checkData.signinMethods.length > 0;
            
            // Si hay error de EMAIL_NOT_FOUND o no hay métodos de autenticación, el usuario no existe
            if (hasEmailNotFound || (!checkData.registered && !hasSignInMethods)) {
              // El usuario no existe, redirigir a registro
              console.log("Email no registrado, redirigiendo a registro");
              setErr("");
              router.push(`/create-user?email=${encodeURIComponent(trimmedEmail)}&from=login&blocked=true`);
              return;
            } else if (checkData.registered === true || hasSignInMethods) {
              // El usuario existe explícitamente, entonces la contraseña es incorrecta
              console.log("Email registrado, contraseña incorrecta");
              setErr("Contraseña incorrecta");
            } else {
              // Si no podemos determinar, redirigir a registro por seguridad
              // (mejor UX: permitir que el usuario cree su cuenta)
              console.log("Estado del email no claro, redirigiendo a registro");
              setErr("");
              router.push(`/create-user?email=${encodeURIComponent(trimmedEmail)}&from=login&blocked=true`);
              return;
            }
          } else {
            // Si no podemos verificar, intentar redirigir a registro por defecto
            // para que el usuario pueda crear su cuenta
            setErr("");
            router.push(`/create-user?email=${encodeURIComponent(trimmedEmail)}&from=login&blocked=true`);
            return;
          }
        } catch (checkError) {
          // Si falla la verificación, redirigir a registro por defecto
          // para que el usuario pueda intentar crear su cuenta
          console.error("Error verificando email:", checkError);
          setErr("");
          router.push(`/create-user?email=${encodeURIComponent(trimmedEmail)}&from=login&blocked=true`);
          return;
        }
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
      router.push(`/create-user?email=${encodeURIComponent(mail)}&from=email`);
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
        
        // Siempre redirigir a la landing page después del login con Google
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

