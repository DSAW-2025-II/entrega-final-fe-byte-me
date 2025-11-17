"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebaseClient";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loading: authLoading } = useAuthGuard({ requireAuth: false });
  const oobCode = searchParams.get("oobCode");

  const [verifying, setVerifying] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const verify = async () => {
      setVerifying(true);
      try {
        if (!oobCode) throw { code: "missing-oob" };
        const email = await verifyPasswordResetCode(auth as any, oobCode);
        setVerifiedEmail(email);
      } catch (e: any) {
        console.error("verify error:", e.code || e.message);
        if (e.code === "auth/expired-action-code") {
          setErr("El enlace ha expirado. Solicita uno nuevo.");
        } else if (e.code === "auth/invalid-action-code" || e.code === "missing-oob") {
          setErr("El enlace no es válido. Abre de nuevo el correo de recuperación.");
        } else {
          setErr("No pudimos validar el enlace. Intenta de nuevo.");
        }
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [oobCode]);

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

  const validatePassword = (password: string, email?: string | null): string | null => {
    if (!password || password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (!/[a-z]/.test(password)) return "La contraseña debe tener al menos una letra minúscula.";
    if (!/[A-Z]/.test(password)) return "La contraseña debe tener al menos una letra mayúscula.";
    if (!/[0-9]/.test(password)) return "La contraseña debe tener al menos un número.";
    if (email) {
      const local = email.split("@")[0];
      if (password === email) return "La contraseña no puede ser igual al correo.";
      if (password === local) return "La contraseña no puede ser igual a la parte local del correo.";
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const validationError = validatePassword(pwd, verifiedEmail);
    if (validationError) return setErr(validationError);
    if (pwd !== pwd2) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    try {
      if (!oobCode) throw new Error("missing-oob");
      await confirmPasswordReset(auth as any, oobCode, pwd);
      setDone(true);
      setTimeout(() => router.push("/pages/login"), 2000);
    } catch (e: any) {
      console.error("confirm error:", e.code, e.message);
      if (e.code === "auth/expired-action-code") setErr("El enlace expiró. Solicita uno nuevo.");
      else if (e.code === "auth/invalid-action-code") setErr("El enlace no es válido. Vuelve a abrirlo desde el correo.");
      else if (e.code === "auth/weak-password") setErr("La contraseña es muy débil. Usa al menos 6 caracteres.");
      else setErr("No pudimos actualizar la contraseña. Intenta de nuevo.");
    }
  };

  if (verifying) {
    return <div style={S.shell}><div style={S.card}>Verificando enlace...</div></div>;
  }
  if (err && !done) {
    return (
      <div style={S.shell}>
        <div style={S.card}>
          <h1 style={{ margin: 0 }}>Reset your password</h1>
          <p style={{ color: "red" }}>{err}</p>
          <Link href="/recover-password" style={S.link}>Solicitar un nuevo enlace</Link>
        </div>
      </div>
    );
  }
  if (done) {
    return (
      <div style={S.shell}>
        <div style={S.card}>
          <h1 style={{ margin: 0 }}>Contraseña actualizada</h1>
          <p>Redirigiendo al login…</p>
        </div>
      </div>
    );
  }

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
              Restablecer contraseña
            </h1>

            {/* Subtítulo */}
            <p style={S.subtitle}>
              {verifiedEmail
                ? <>Escribe una nueva contraseña para <b>{verifiedEmail}</b></>
                : "Escribe una nueva contraseña segura."}
            </p>

            {/* Campo Nueva contraseña */}
            <label style={S.label}>Nueva contraseña</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="password"
              placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="new-password"
            />

            {/* Campo Confirmar contraseña */}
            <label style={S.label}>Confirmar contraseña</label>
            <input
              style={{ ...S.input, height: isMobile ? 44 : 46 }}
              type="password"
              placeholder="Confirma tu contraseña"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              autoComplete="new-password"
            />

            {err && <div style={S.error}>{err}</div>}
            {done && (
              <div style={S.success}>
                Tu contraseña se actualizó correctamente.{" "}
                <span style={{ color: "#000" }}>Redirigiéndote al login…</span>
              </div>
            )}

            {/* Botón Guardar */}
            <button
              style={{ ...S.submitButton, height: isMobile ? 44 : 46 }}
              onClick={onSubmit as any}
            >
              Guardar contraseña
            </button>

            {/* Link para volver al login */}
            <Link href="/pages/login" style={S.loginLink}>Volver al login</Link>
          </div>
        </div>

        {/* DERECHA - IMAGEN (solo desktop) */}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={S.shell}>
          <div style={S.card}>Verificando enlace...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

const S: any = {
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
  card: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
    padding: 24,
    maxWidth: 480,
    margin: "0 auto",
  },
  link: {
    display: "inline-block",
    marginTop: 4,
    color: "#0126B9",
    textDecoration: "underline",
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
    display: "grid",
    placeItems: "center",
    paddingRight: 12,
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
    color: "#0126B9",
    textDecoration: "underline",
    fontWeight: 400,
    fontSize: 14,
    cursor: "pointer",
    width: "fit-content",
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



