"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { auth, storage, initializeFirebase } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { api } from "@/lib/api";
import ButtonBlack from "@/components/ButtonBlack";
import ButtonOutline from "@/components/ButtonOutline";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Celular Colombia - debe iniciar con 3 y tener exactamente 10 dígitos
const CO_CELL_RE = /^3\d{9}$/;

// Código institucional - 4 ceros seguidos y luego 6 dígitos (total 10)
const UNIVERSITY_CODE_RE = /^0000\d{6}$/;

// Solo letras (incluye acentos y espacios)
const ONLY_LETTERS_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

// Email debe terminar en @unisabana.edu.co
const UNISABANA_EMAIL_RE = /^[a-zA-Z0-9._-]+@unisabana\.edu\.co$/;

// Contraseña segura: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function CreateUserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const from = searchParams.get("from");
  const isGoogle = from === "google";
  const uidParam = searchParams.get("uid");
  const emailParam = searchParams.get("email");
  const nameParam = searchParams.get("name");
  const photoParam = searchParams.get("photo");

  const [isMobile, setIsMobile] = useState(false);

  const prefill = useMemo(() => {
    const dn = nameParam || "";
    const parts = dn.trim().split(/\s+/);
    return {
      email: emailParam || "",
      first: parts[0] || "",
      last: parts.slice(1).join(" ") || "",
      photoURL: photoParam || null,
    };
  }, [emailParam, nameParam, photoParam]);

  // Form
  const [first_name, setFirst] = useState(prefill.first);
  const [last_name, setLast] = useState(prefill.last);
  const [email, setEmail] = useState(prefill.email);
  const [pass, setPass] = useState("");
  const [phone, setPhone] = useState("");
  const [universityCode, setUniversityCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(prefill.photoURL || "/iconUser.png");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // Validaciones en tiempo real
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [nameError, setNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passError, setPassError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Inicializar Firebase si no está inicializado
    initializeFirebase();
    
    const m = window.matchMedia("(max-width:768px)");
    const on = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Asegurar que Firebase esté inicializado
    initializeFirebase();
    
    if (isGoogle && auth && !auth.currentUser) {
      router.replace("/pages/login");
    }
  }, [isGoogle, router]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  async function cleanupGoogleAccount() {
    try {
      if (auth && auth.currentUser) await deleteUser(auth.currentUser);
    } catch (e) {
      console.error("Error cleaning up Google account:", e);
    }
  }

  async function handleCancel() {
    if (isGoogle) await cleanupGoogleAccount();
    router.replace("/pages/login");
  }

  // Funciones de validación
  const validateEmail = (email: string): string | null => {
    if (!email?.trim()) return "El correo es obligatorio.";
    if (!UNISABANA_EMAIL_RE.test(email.trim())) {
      return "El correo debe ser institucional (@unisabana.edu.co).";
    }
    return null;
  };

  const validateUniversityCode = (code: string): string | null => {
    if (!code?.trim()) return "El código de la universidad es obligatorio.";
    const trimmed = code.trim();
    if (trimmed.length !== 10) {
      return "El código debe tener exactamente 10 dígitos (0000 + 6 dígitos).";
    }
    if (!UNIVERSITY_CODE_RE.test(trimmed)) {
      return "El código debe comenzar con 0000 seguido de 6 dígitos (ej: 0000123456).";
    }
    return null;
  };

  const validateName = (name: string, fieldName: string): string | null => {
    if (!name?.trim()) return `${fieldName} es obligatorio.`;
    if (!ONLY_LETTERS_RE.test(name.trim())) {
      return `${fieldName} solo puede contener letras.`;
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone?.trim()) return "El teléfono celular es obligatorio.";
    // Remover espacios, guiones y +57 para validar
    const cleaned = phone.replace(/[\s-+]/g, "").replace(/^57/, "");
    if (cleaned.length !== 10) {
      return "El teléfono debe tener exactamente 10 dígitos.";
    }
    if (!CO_CELL_RE.test(cleaned)) {
      return "El teléfono debe iniciar con 3 y tener 10 dígitos (ej: 3123456789).";
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "La contraseña es obligatoria.";
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    if (!STRONG_PASSWORD_RE.test(password)) {
      return "La contraseña debe contener al menos una mayúscula, una minúscula y un número.";
    }
    return null;
  };

  function validateClient({
    first_name,
    last_name,
    phone,
    uid,
    isGoogle,
    email,
    pass,
    universityCode,
  }: {
    first_name: string;
    last_name: string;
    phone: string;
    uid: string | null;
    isGoogle: boolean;
    email: string;
    pass: string;
    universityCode: string;
  }): string | null {
    const codeErr = validateUniversityCode(universityCode);
    if (codeErr) return codeErr;

    const nameErr = validateName(first_name, "El nombre");
    if (nameErr) return nameErr;

    const lastNameErr = validateName(last_name, "El apellido");
    if (lastNameErr) return lastNameErr;

    const phoneErr = validatePhone(phone);
    if (phoneErr) return phoneErr;

    if (!uid) return "ID de usuario inválido. Inicia sesión nuevamente.";

    if (!isGoogle) {
      const emailErr = validateEmail(email);
      if (emailErr) return emailErr;

      const passErr = validatePassword(pass);
      if (passErr) return passErr;
    }

    return null;
  }

  function normalizePhoneCO(p: string): string {
    // Remover espacios, guiones y +57, luego agregar +57 al inicio
    const cleaned = p.replace(/[\s-+]/g, "").replace(/^57/, "");
    if (cleaned.length === 10 && cleaned.startsWith("3")) {
      return `+57${cleaned}`;
    }
    return p.trim();
  }

  // Handlers con validación en tiempo real
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (!isGoogle) {
      const error = validateEmail(value);
      setEmailError(error || "");
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números
    const value = e.target.value.replace(/\D/g, "");
    // Limitar a 10 dígitos
    const limited = value.slice(0, 10);
    setUniversityCode(limited);
    const error = validateUniversityCode(limited);
    setCodeError(error || "");
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir letras y espacios
    const filtered = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
    setFirst(filtered);
    const error = validateName(filtered, "El nombre");
    setNameError(error || "");
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir letras y espacios
    const filtered = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
    setLast(filtered);
    const error = validateName(filtered, "El apellido");
    setLastNameError(error || "");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números, espacios, guiones y +
    const value = e.target.value.replace(/[^\d\s-+]/g, "");
    // Limitar a 13 caracteres máximo (incluyendo +57)
    const limited = value.slice(0, 13);
    setPhone(limited);
    const error = validatePhone(limited);
    setPhoneError(error || "");
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPass(value);
    if (!isGoogle) {
      const error = validatePassword(value);
      setPassError(error || "");
    }
  };

  async function handleSubmit() {
    setErr("");
    setOk("");
    setLoading(true);

    let createdAuth = false;

    try {
      // Asegurar que Firebase esté inicializado
      initializeFirebase();
      
      if (!auth) {
        throw new Error("Firebase no está inicializado. Recarga la página.");
      }

      let uid = auth.currentUser?.uid || (isGoogle ? (uidParam || null) : null);
      let mail = (email || "").trim();

      // Prevalidación con funciones de validación
      const codeErr = validateUniversityCode(universityCode);
      if (codeErr) throw new Error(codeErr);

      const nameErr = validateName(first_name, "El nombre");
      if (nameErr) throw new Error(nameErr);

      const lastNameErr = validateName(last_name, "El apellido");
      if (lastNameErr) throw new Error(lastNameErr);

      const phoneErr = validatePhone(phone);
      if (phoneErr) throw new Error(phoneErr);

      if (!isGoogle) {
        const emailErr = validateEmail(mail);
        if (emailErr) throw new Error(emailErr);

        const passErr = validatePassword(pass);
        if (passErr) throw new Error(passErr);
      }

      if (!auth) {
        throw new Error("Firebase no está inicializado. Recarga la página.");
      }

      if (!isGoogle) {
        const methods = await fetchSignInMethodsForEmail(auth, mail);
        if (methods.length > 0) {
          throw new Error("Ese correo ya está registrado. Inicia sesión.");
        }
        const cred = await createUserWithEmailAndPassword(auth, mail, pass);
        uid = cred.user.uid;
        mail = cred.user.email || mail;
        createdAuth = true;
        // Esperar un momento para que Firebase Auth se actualice
        await delay(300);
      } else {
        if (!uid) throw new Error("Sesión de Google inválida.");
        mail = auth.currentUser?.email || mail;
      }

      // Validación final con UID real
      const vErr = validateClient({
        first_name,
        last_name,
        phone,
        uid: uid || "",
        isGoogle,
        email: mail,
        pass,
        universityCode,
      });

      if (vErr) {
        if (createdAuth && auth.currentUser) {
          await deleteUser(auth.currentUser);
        }
        if (isGoogle) await cleanupGoogleAccount();
        throw new Error(vErr);
      }

      // Asegurar que tenemos el usuario actual
      if (!auth || !auth.currentUser) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      }

      // Obtener token para autenticación
      const idToken = await auth.currentUser.getIdToken(true);
      if (!idToken) {
        throw new Error("No se pudo obtener el token de autenticación");
      }

      const base = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        user_id: universityCode.trim(),
        email: mail,
        phone: normalizePhoneCO(phone),
        user_photo: null,
      };

      // PASO 1: Registrar usuario en el backend (sin foto) - ESTO ES OBLIGATORIO
      console.log("Guardando usuario en la base de datos...", base);
      const registerResponse = await api.post("/api/auth/register", base, idToken);
      console.log("Usuario guardado en la base de datos:", registerResponse);
      
      // Verificar que el registro fue exitoso
      if (!registerResponse || (registerResponse.error && !registerResponse.message)) {
        throw new Error("No se pudo guardar el usuario en la base de datos. Intenta nuevamente.");
      }

      // PASO 2: Foto opcional - intentar subir y actualizar
      let photoUrl = null;
      
      if (prefill.photoURL) {
        // Si viene de Google, usar la foto existente
        photoUrl = prefill.photoURL;
        try {
          console.log("Actualizando usuario con foto de Google...");
          await api.post("/api/auth/register", { ...base, user_photo: photoUrl }, idToken);
          console.log("Foto de Google actualizada correctamente");
        } catch (photoErr: any) {
          console.warn("No se pudo actualizar la foto de Google (continuando sin foto):", photoErr);
          // No es crítico, continuar sin foto
        }
      } else if (file && storage) {
        try {
          const currentStorage = storage;
          if (!currentStorage) {
            throw new Error("Firebase Storage no está inicializado");
          }
          
          console.log("Subiendo foto a Firebase Storage...");
          
          // Timeout de 8 segundos para la subida de foto
          const uploadPromise = async () => {
            const storageRef = ref(currentStorage, `users/${uid}/profile.jpg`);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
          };

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout subiendo foto")), 8000)
          );

          photoUrl = await Promise.race([uploadPromise(), timeoutPromise]) as string;
          console.log("Foto subida correctamente:", photoUrl);
          
          // Actualizar usuario con la foto
          console.log("Actualizando usuario con foto subida...");
          await api.post("/api/auth/register", { ...base, user_photo: photoUrl }, idToken);
          console.log("Usuario actualizado con foto correctamente");
        } catch (photoErr: any) {
          console.warn("No se pudo subir la foto (continuando sin foto):", photoErr);
          // No es crítico, el usuario ya está guardado en la base de datos
        }
      }

      // Mostrar mensaje de éxito
      setOk("Usuario creado correctamente");
      await delay(1000);
      
      // Redirigir a la landing page después de crear el usuario
      router.replace("/pages/login/landing");
    } catch (e: any) {
      console.error("Error en handleSubmit:", e);
      try {
        if (createdAuth && auth && auth.currentUser) {
          await deleteUser(auth.currentUser);
        }
      } catch (cleanupErr) {
        console.error("Error cleaning up:", cleanupErr);
      }
      
      // Mensajes de error más descriptivos
      let errorMessage = e?.message || "Error al crear usuario";
      
      // Mejorar mensajes de error de Firebase
      if (e?.code === "auth/email-already-in-use") {
        errorMessage = "Este correo ya está registrado. Inicia sesión.";
      } else if (e?.code === "auth/weak-password") {
        errorMessage = "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
      } else if (e?.code === "auth/invalid-email") {
        errorMessage = "El correo electrónico no es válido.";
      } else if (errorMessage.includes("fetch")) {
        errorMessage = "Error de conexión con el servidor. Verifica que el backend esté corriendo.";
      }
      
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.container}>
      <div style={{ 
        ...S.card, 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      } as React.CSSProperties}>
        <div style={S.left}>
          <h1 style={S.title}>Crear usuario</h1>

          <label style={S.label}>Código de la universidad</label>
          <input
            style={{
              ...S.input,
              borderColor: codeError ? "#b00020" : "#ccc",
            }}
            value={universityCode}
            onChange={handleCodeChange}
            placeholder="0000123456"
            maxLength={10}
            inputMode="numeric"
            required
          />
          {codeError && <div style={S.fieldError}>{codeError}</div>}

          <label style={S.label}>Nombre</label>
          <input
            style={{
              ...S.input,
              borderColor: nameError ? "#b00020" : "#ccc",
            }}
            value={first_name}
            onChange={handleFirstNameChange}
            placeholder="Tu nombre"
            required
          />
          {nameError && <div style={S.fieldError}>{nameError}</div>}

          <label style={S.label}>Apellido</label>
          <input
            style={{
              ...S.input,
              borderColor: lastNameError ? "#b00020" : "#ccc",
            }}
            value={last_name}
            onChange={handleLastNameChange}
            placeholder="Apellido"
            required
          />
          {lastNameError && <div style={S.fieldError}>{lastNameError}</div>}

          <label style={S.label}>Correo</label>
          <input
            style={{
              ...S.input,
              borderColor: emailError ? "#b00020" : "#ccc",
              backgroundColor: isGoogle ? "#f5f5f5" : "#fff",
              cursor: isGoogle ? "not-allowed" : "text",
            }}
            value={email}
            onChange={handleEmailChange}
            placeholder="correo@unisabana.edu.co"
            type="email"
            readOnly={!isGoogle}
            disabled={isGoogle}
            required={!isGoogle}
          />
          {emailError && !isGoogle && <div style={S.fieldError}>{emailError}</div>}
          {!isGoogle && (
            <div style={S.hint}>Solo se permiten correos @unisabana.edu.co</div>
          )}

          {!isGoogle && (
            <>
              <label style={S.label}>Contraseña</label>
              <input
                style={{
                  ...S.input,
                  borderColor: passError ? "#b00020" : "#ccc",
                }}
                type="password"
                value={pass}
                onChange={handlePassChange}
                placeholder="••••••••"
                required
              />
              {passError && <div style={S.fieldError}>{passError}</div>}
              <div style={S.hint}>
                Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número
              </div>
            </>
          )}

          <label style={S.label}>Teléfono celular (Colombia)</label>
          <input
            style={{
              ...S.input,
              borderColor: phoneError ? "#b00020" : "#ccc",
            }}
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="3123456789"
            maxLength={13}
            required
          />
          {phoneError && <div style={S.fieldError}>{phoneError}</div>}
          <div style={S.hint}>Debe iniciar con 3 y tener 10 dígitos</div>

          {err && <div style={S.error}>{err}</div>}
          {ok && <div style={S.ok}>{ok}</div>}

          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <ButtonBlack onClick={handleSubmit} disabled={loading}>
              {loading ? "Creando..." : "Confirmar"}
            </ButtonBlack>
            <ButtonOutline onClick={handleCancel} disabled={loading}>
              Cancelar
            </ButtonOutline>
          </div>
        </div>

        {!isMobile && (
          <div style={S.right}>
            <div style={S.bg}>
              <Image
                src="/bgUser.png"
                alt="Background"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
              <div style={S.userSection}>
                <div style={S.avatarContainer}>
                  <img
                    src={preview || "/iconUser.png"}
                    alt="avatar"
                    style={S.avatar}
                    onError={(e) => {
                      // Si falla la imagen, usar el icono por defecto
                      const target = e.target as HTMLImageElement;
                      target.src = "/iconUser.png";
                    }}
                  />
                </div>
                <label style={S.selectPhotoBtn}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelect}
                    style={{ display: "none" }}
                  />
                  Seleccionar foto
                </label>
                <p style={S.tagline}>From campus to home, together.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- ESTILOS ---------- */
const S = {
  container: {
    width: "100vw",
    minHeight: "100vh",
    background: "#f5f6f8",
    display: "grid",
    placeItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 1100,
    display: "grid",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 15px 45px rgba(0,0,0,0.1)",
  },
  left: {
    padding: "40px 60px",
    display: "grid",
    gap: 10,
    alignContent: "start",
  },
  right: { position: "relative" as const },
  bg: {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
  },
  userSection: {
    position: "relative" as const,
    zIndex: 2,
    display: "grid",
    gap: 12,
    justifyItems: "center",
  },
  avatarContainer: {
    position: "relative" as const,
    width: 100,
    height: 100,
    borderRadius: "50%",
    overflow: "hidden" as const,
    border: "2px solid #fff",
    boxShadow: "0 0 8px rgba(0,0,0,0.2)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  selectPhotoBtn: {
    padding: "10px 20px",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    border: "1px solid rgba(255,255,255,0.3)",
    backdropFilter: "blur(5px)",
  },
  tagline: {
    marginTop: 50,
    padding: "12px 18px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
    textAlign: "center" as const,
    backdropFilter: "blur(5px)",
    fontWeight: 500,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    color: "#111",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "#111",
    marginTop: 6,
    fontWeight: 500,
  },
  input: {
    height: 44,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: "0 14px",
    fontSize: 15,
    background: "#fff",
    color: "#111",
  },
  error: {
    background: "#ffeef0",
    color: "#b00020",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
  },
  ok: {
    background: "#e6ffed",
    color: "#056f00",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
  },
  fieldError: {
    color: "#b00020",
    fontSize: 12,
    marginTop: -4,
    marginBottom: 4,
  },
  hint: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: -4,
    marginBottom: 4,
  },
};

export default function CreateUser() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <p>Cargando...</p>
      </div>
    }>
      <CreateUserForm />
    </Suspense>
  );
}

