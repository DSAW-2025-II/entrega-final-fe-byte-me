"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const resetToken = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleReset = async () => {
    setErr("");
    setOk("");

    if (!newPassword || newPassword.length < 6) {
      setErr("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("Las contraseñas no coinciden");
      return;
    }

    if (!resetToken) {
      setErr("Token de reset no válido. Regresa e intenta nuevamente.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/reset-password", {
        resetToken: resetToken,
        newPassword: newPassword,
      });

      setOk("Contraseña actualizada correctamente. Redirigiendo al login...");
      await delay(2000);

      // Redirigir al login
      router.push("/pages/login");
    } catch (e: any) {
      setErr(e.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.shell}>
      <div
        style={{
          ...S.canvas,
          gridTemplateColumns: isMobile ? "1fr" : "2fr 3fr",
          maxWidth: 1280,
          maxHeight: 832,
          width: "100%",
          height: "100%",
        }}
      >
        {/* IZQUIERDA - FORMULARIO */}
        <div style={{ ...S.leftPane, padding: isMobile ? 20 : 32 }}>
          <div style={{ ...S.formCard, width: isMobile ? "100%" : 420 }}>
            {/* Logo */}
            <div style={S.logo}>MoveTogether</div>

            {/* Título */}
            <h1 style={{ ...S.title, fontSize: isMobile ? 28 : 36 }}>
              Nueva contraseña
            </h1>

            {/* Subtítulo */}
            <p style={S.subtitle}>Ingresa tu nueva contraseña</p>

            {/* Campo Nueva contraseña */}
            <label style={S.label}>Nueva contraseña</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />

            {/* Campo Confirmar contraseña */}
            <label style={S.label}>Confirmar contraseña</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="password"
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            {err && <div style={S.error}>{err}</div>}
            {ok && <div style={S.success}>{ok}</div>}

            {/* Botón Actualizar contraseña */}
            <button
              style={{
                ...S.submitButton,
                height: isMobile ? 44 : 46,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onClick={handleReset}
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>

            {/* Link para volver al login */}
            <button
              type="button"
              onClick={() => router.push("/pages/login")}
              style={S.loginLink}
            >
              Volver al login
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

export default function ResetPassword() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
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
  submitButton: {
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

