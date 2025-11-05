"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

// Celular Colombia
const CO_CELL_RE = /^(?:\+57\s*)?(3\d{2})[\s-]?(\d{3})[\s-]?(\d{4})$/;

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
  const [preview, setPreview] = useState(prefill.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

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
    if (!universityCode?.trim()) return "El código de la universidad es obligatorio.";
    if (!first_name?.trim()) return "El nombre no puede ser nulo.";
    if (!last_name?.trim()) return "El apellido no puede ser nulo.";
    if (!phone?.trim()) return "El teléfono celular es obligatorio.";
    if (!CO_CELL_RE.test(phone.trim())) {
      return "Celular inválido (Colombia). Debe iniciar en 3 y tener 10 dígitos. Puede incluir +57.";
    }
    if (!uid) return "ID de usuario inválido. Inicia sesión nuevamente.";
    if (!isGoogle) {
      if (!email?.trim()) return "El correo es obligatorio.";
      if (!pass) return "La contraseña es obligatoria.";
    }
    return null;
  }

  function normalizePhoneCO(p: string): string {
    const m = p.trim().match(CO_CELL_RE);
    return m ? `+57${m[1]}${m[2]}${m[3]}` : p.trim();
  }

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

      // Prevalidación básica
      const preErrBasic =
        !universityCode?.trim()
          ? "El código de la universidad es obligatorio."
          : !first_name?.trim()
          ? "El nombre no puede ser nulo."
          : !last_name?.trim()
          ? "El apellido no puede ser nulo."
          : !phone?.trim()
          ? "El teléfono celular es obligatorio."
          : !CO_CELL_RE.test(phone.trim())
          ? "Celular inválido (Colombia)."
          : !isGoogle && !mail
          ? "El correo es obligatorio."
          : !isGoogle && !pass
          ? "La contraseña es obligatoria."
          : null;

      if (preErrBasic) throw new Error(preErrBasic);

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
      const registerResponse = await api.post("/api/register", base, idToken);
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
          await api.post("/api/register", { ...base, user_photo: photoUrl }, idToken);
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
          await api.post("/api/register", { ...base, user_photo: photoUrl }, idToken);
          console.log("Usuario actualizado con foto correctamente");
        } catch (photoErr: any) {
          console.warn("No se pudo subir la foto (continuando sin foto):", photoErr);
          // No es crítico, el usuario ya está guardado en la base de datos
        }
      }

      // Mostrar mensaje de éxito
      setOk("Usuario creado correctamente");
      await delay(1000);
      
      // Redirigir al dashboard
      router.replace("/dashboard");
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
            style={S.input}
            value={universityCode}
            onChange={(e) => setUniversityCode(e.target.value)}
            placeholder="Código institucional"
            required
          />

          <label style={S.label}>Nombre</label>
          <input
            style={S.input}
            value={first_name}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="Tu nombre"
            required
          />

          <label style={S.label}>Apellido</label>
          <input
            style={S.input}
            value={last_name}
            onChange={(e) => setLast(e.target.value)}
            placeholder="Apellido"
            required
          />

          <label style={S.label}>Correo</label>
          <input
            style={S.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@unisabana.edu.co"
            type="email"
            disabled={isGoogle}
            required={!isGoogle}
          />

          {!isGoogle && (
            <>
              <label style={S.label}>Contraseña</label>
              <input
                style={S.input}
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                required
              />
            </>
          )}

          <label style={S.label}>Teléfono celular (Colombia)</label>
          <input
            style={S.input}
            type="tel"
            inputMode="numeric"
            pattern="^(\+57\s*)?(3\d{2})[\s-]?(\d{3})[\s-]?(\d{4})$"
            title="10 dígitos iniciando en 3. Puede incluir +57."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 3xx xxx xxxx"
            required
          />

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
              <div style={S.userSection}>
                <img
                  src={preview || "/placeholder-user.png"}
                  alt="avatar"
                  style={S.avatar}
                />
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
    position: "absolute" as const,
    inset: 0,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "grid",
    placeItems: "center",
  },
  userSection: {
    display: "grid",
    gap: 12,
    justifyItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    objectFit: "cover" as const,
    border: "2px solid #fff",
    boxShadow: "0 0 8px rgba(0,0,0,0.2)",
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
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    color: "#111",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginTop: 6,
  },
  input: {
    height: 44,
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: "0 14px",
    fontSize: 15,
    background: "#fff",
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

