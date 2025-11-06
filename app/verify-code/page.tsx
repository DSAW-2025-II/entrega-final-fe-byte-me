"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Focus en el primer input al cargar
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setErr("");

    // Auto-focus al siguiente input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 4);
    if (/^\d{4}$/.test(pasted)) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[3]?.focus();
    }
  };

  const verifyCode = async () => {
    setErr("");
    
    const codeString = code.join("");
    if (codeString.length !== 4) {
      setErr("Por favor ingresa el código completo");
      return;
    }

    if (!email) {
      setErr("Email no encontrado. Regresa e intenta nuevamente.");
      return;
    }

    setLoading(true);

    try {
      const data = await api.post("/api/auth/verify-otp", {
        email: email,
        code: codeString,
      });

      // Redirigir a la página de reset de contraseña
      router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(data.resetToken)}`);
    } catch (e: any) {
      setErr(e.message || "Error al verificar el código");
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
              Recover password
            </h1>

            {/* Subtítulo */}
            <p style={S.subtitle}>write the code</p>

            {/* Campos de código */}
            <div style={S.codeContainer} onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    if (el) {
                      inputRefs.current[index] = el;
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={S.codeInput}
                />
              ))}
            </div>

            {err && <div style={S.error}>{err}</div>}

            {/* Botón Confirm the code */}
            <button
              style={{
                ...S.confirmButton,
                height: isMobile ? 44 : 46,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onClick={verifyCode}
              disabled={loading || code.join("").length !== 4}
            >
              {loading ? "Verificando..." : "Confirm the code"}
            </button>

            {/* Link para volver */}
            <button
              type="button"
              onClick={() => router.push("/recover-password")}
              style={S.backLink}
            >
              Volver
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
  codeContainer: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  codeInput: {
    width: 60,
    height: 60,
    border: "1px solid #dedede",
    borderRadius: 10,
    fontSize: 24,
    textAlign: "center" as const,
    background: "#fff",
    color: "#111",
    outline: "none",
    fontWeight: 600,
  },
  confirmButton: {
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
  backLink: {
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
};

