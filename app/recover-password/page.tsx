"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth as clientAuth } from "@/lib/firebaseClient";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function RecoverPassword() {
  const router = useRouter();
  const { loading: authLoading } = useAuthGuard({ requireAuth: false });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkMedia = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkMedia();
    window.addEventListener("resize", checkMedia);
    return () => window.removeEventListener("resize", checkMedia);
  }, []);

  // Mostrar loader mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div style={S.loadingContainer}>
        <div style={S.loadingSpinner}>Cargando...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setOk("");
    
    const trimmedEmail = email.trim();
    
    // Validar que se ingrese un correo
    if (!trimmedEmail) {
      setErr("Ingresa un correo electrónico");
      return;
    }
    
    // Validar que sea correo institucional
    if (!trimmedEmail.endsWith("@unisabana.edu.co")) {
      setErr("Solo se permiten correos @unisabana.edu.co");
      return;
    }
    
    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErr("Formato de correo inválido");
      return;
    }
    
    setLoading(true);

    try {
      // Solo permitir correos institucionales
      if (!trimmedEmail.toLowerCase().endsWith("@unisabana.edu.co")) {
        setErr("Solo se permite recuperar contraseña para correos @unisabana.edu.co.");
        return;
      }
      if (!clientAuth) {
        throw new Error("Config de Firebase ausente. Revisa NEXT_PUBLIC_*");
      }
      // Enviar con Firebase para que abra la URL personalizada configurada en la consola
      await sendPasswordResetEmail(clientAuth, trimmedEmail);
      setOk("Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.");
    } catch (e: any) {
      console.error("Error al enviar reset:", e);
      const code = e?.code || "";
      if (code === "auth/user-not-found") {
        setOk("Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.");
        return;
      }
      if (code === "auth/invalid-email") {
        setErr("Formato de correo inválido");
        return;
      }
      setErr("No se pudo enviar el correo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.shell}>
      <div
        style={{
          ...S.canvas,
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 3fr",
          maxWidth: isMobile ? "100%" : 1280,
          maxHeight: isMobile ? "100%" : 832,
          width: "100%",
          height: isMobile ? "100%" : "auto",
          minHeight: isMobile ? "100vh" : "auto",
        }}
      >
        {/* IZQUIERDA - FORMULARIO */}
        <div style={{ ...S.leftPane, padding: isMobile ? "24px 20px" : isTablet ? 28 : 32 }}>
          <div style={{ ...S.formCard, width: isMobile ? "100%" : isTablet ? "90%" : 420, maxWidth: isMobile ? "100%" : 420 }}>
            {/* Logo */}
            <div style={S.logo}>MoveTogether</div>

            {/* Título */}
            <h1 style={{ ...S.title, fontSize: isMobile ? 28 : 36 }}>
              Recuperar contraseña
            </h1>

            {/* Subtítulo */}
            <p style={S.subtitle}>Ingresa tu correo institucional para recuperar tu cuenta</p>

            {/* Campo E-mail */}
            <label style={S.label}>Correo electrónico</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="email"
              placeholder="Ingresa tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            {err && <div style={S.error}>{err}</div>}
            {ok && <div style={S.success}>{ok}</div>}

            {/* Formulario: submit evita recarga y hace XHR a Firebase */}
            <form onSubmit={handleSubmit}>
              {/* Botón enviar link */}
              <button
              style={{
                ...S.sendButton,
                height: isMobile ? 44 : 46,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              type="submit"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>

            {/* Link para volver al login */}
            <button
              type="button"
              onClick={() => router.push("/pages/login")}
              style={S.loginLink}
            >
              Ya tengo una cuenta
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
    minHeight: "100vh",
    background: "#f5f6f8",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    boxSizing: "border-box" as const,
  },
  loadingContainer: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f6f8",
  },
  loadingSpinner: {
    fontSize: 16,
    color: "#666",
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
    background: "#fff",
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
    width: "100%",
  },
  logo: {
    fontSize: 20,
    fontWeight: 800,
    color: "#111",
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontWeight: 800,
    color: "#111",
    marginBottom: 8,
  },
  subtitle: {
    margin: 0,
    fontSize: 16,
    color: "#333",
    fontWeight: 400,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginTop: 8,
    fontWeight: 500,
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
    outline: "none",
  },
  sendButton: {
    marginTop: 20,
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "0 14px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  loginLink: {
    marginTop: 16,
    background: "transparent",
    border: "none",
    padding: 0,
    color: "#0126B9",
    fontWeight: 400,
    fontSize: 14,
    cursor: "pointer",
    width: "fit-content",
    textAlign: "left" as const,
  },
  error: {
    background: "#ffeef0",
    color: "#b00020",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    marginTop: 8,
  },
  success: {
    background: "#e6ffed",
    color: "#056f00",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    marginTop: 8,
  },
};

