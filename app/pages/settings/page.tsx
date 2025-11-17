"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { initializeFirebase } from "@/lib/firebase";
import { useTheme } from "@/app/contexts/ThemeContext";
import NotificationButton from "@/app/components/NotificationButton";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState("");
  
  // Usar el contexto global
  const {
    theme: savedTheme,
    language: savedLanguage,
    notifications: savedNotifications,
    setTheme: setThemeContext,
    setLanguage: setLanguageContext,
    setNotifications: setNotificationsContext,
    saveSettings: saveSettingsContext,
  } = useTheme();
  
  // Settings state - valores temporales (lo que el usuario está seleccionando)
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(true);
  
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkMedia = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMedia();
    window.addEventListener("resize", checkMedia);
    
    return () => {
      window.removeEventListener("resize", checkMedia);
    };
  }, []);

  useEffect(() => {
    fetchUserData();
    // Inicializar valores temporales con los valores del contexto
    setLanguage(savedLanguage);
    setTheme(savedTheme);
    setNotifications(savedNotifications);
    
    // Verificar autenticación al cargar
    const checkAuth = async () => {
      try {
        initializeFirebase();
        if (auth && auth.currentUser) {
          console.log("✅ Usuario autenticado:", auth.currentUser.email);
        } else {
          console.warn("⚠️ No hay usuario autenticado");
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
      }
    };
    checkAuth();
  }, [router, savedLanguage, savedTheme, savedNotifications]);

  type UserData = {
    first_name?: string;
    last_name?: string;
    phone?: string;
    user_id?: string;
    email?: string;
    [key: string]: any;
  };

  const fetchUserData = async () => {
    try {
      const validToken = await ensureValidToken();
      if (!validToken) {
        router.push("/pages/login");
        return;
      }

      const userData: UserData | null = null;
      const safeUser = (userData ?? {}) as UserData;
      const first = (safeUser.first_name ?? "").trim();
      const last = (safeUser.last_name ?? "").trim();
      const full = (first || last)
        ? `${first} ${last}`.trim()
        : (safeUser.email ? safeUser.email.split("@")[0] : "User");
      setUserName(full);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    // Actualizar el contexto global (esto aplicará los cambios en toda la app)
    setThemeContext(theme);
    setLanguageContext(language);
    setNotificationsContext(notifications);
    
    // Guardar en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
      localStorage.setItem("language", language);
      localStorage.setItem("notifications", notifications.toString());
    }
    
    // Forzar actualización del tema aplicándolo directamente al DOM
    const html = document.documentElement;
    const body = document.body;
    
    // Aplicar tema inmediatamente
    if (theme === "dark") {
      html.style.colorScheme = "dark";
      html.setAttribute("data-theme", "dark");
      html.classList.remove("theme-light");
      html.classList.add("theme-dark");
      body.classList.remove("theme-light");
      body.classList.add("theme-dark");
      body.style.backgroundColor = "#0a0a0a";
      body.style.color = "#ededed";
    } else {
      html.style.colorScheme = "light";
      html.setAttribute("data-theme", "light");
      html.classList.remove("theme-dark");
      html.classList.add("theme-light");
      body.classList.remove("theme-dark");
      body.classList.add("theme-light");
      body.style.backgroundColor = "#ffffff";
      body.style.color = "#171717";
    }
    
    // Aplicar idioma inmediatamente
    if (typeof window !== "undefined") {
      document.documentElement.lang = language;
    }
    
    // Mostrar mensaje de éxito
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(savedLanguage === "es" ? "Todos los campos son requeridos" : "All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(savedLanguage === "es" ? "Las contraseñas no coinciden" : "Passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(savedLanguage === "es" ? "Pon una contraseña nueva. La nueva contraseña debe ser diferente a la actual." : "Enter a new password. The new password must be different from the current one.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(savedLanguage === "es" ? "La contraseña debe tener al menos 8 caracteres" : "Password must be at least 8 characters");
      return;
    }

    // Validar contraseña segura
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setPasswordError(savedLanguage === "es" 
        ? "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
        : "Password must contain at least one uppercase, one lowercase and one number");
      return;
    }

    setSaving(true);

    try {
      // Inicializar Firebase
      initializeFirebase();
      
      // Esperar un momento para que Firebase se inicialice completamente
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Importar funciones de Firebase Auth
      const firebaseAuth = await import("firebase/auth");
      const { 
        EmailAuthProvider, 
        reauthenticateWithCredential, 
        updatePassword,
        signInWithCustomToken,
        onAuthStateChanged
      } = firebaseAuth;
      
      // Verificar que auth esté inicializado
      if (!auth) {
        console.error("❌ auth es null");
        throw new Error(savedLanguage === "es" 
          ? "Firebase Auth no está inicializado. Recarga la página."
          : "Firebase Auth is not initialized. Please reload the page.");
      }

      // Intentar obtener el token del backend primero
      const validToken = await ensureValidToken();
      if (!validToken) {
        console.error("❌ No hay token válido del backend");
        throw new Error(savedLanguage === "es" 
          ? "No hay sesión activa. Por favor, inicia sesión nuevamente."
          : "No active session. Please log in again.");
      }

      // Verificar que haya un usuario autenticado en Firebase Auth
      // IMPORTANTE: Para cambiar la contraseña, el usuario DEBE estar autenticado en Firebase Auth del cliente
      let user = auth.currentUser;
      
      // Si no hay usuario en Firebase Auth, obtener el email del backend y autenticarlo
      if (!user) {
        console.log("⚠️ No hay usuario en Firebase Auth, obteniendo email del backend...");
        
        try {
          // Obtener información del usuario desde el backend
          const userData = await api.get("/api/me", validToken);
          if (!userData || !userData.email) {
            throw new Error(savedLanguage === "es" 
              ? "No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente."
              : "Could not get user information. Please log in again.");
          }
          
          console.log("📧 Email del usuario desde backend:", userData.email);
          
          // Autenticar al usuario en Firebase Auth usando el email y la contraseña actual
          // Esto valida la contraseña actual y autentica al usuario en Firebase Auth
          const { signInWithEmailAndPassword } = firebaseAuth;
          
          console.log("🔄 Autenticando en Firebase Auth con email y contraseña actual...");
          try {
            const userCredential = await signInWithEmailAndPassword(
              auth,
              userData.email,
              currentPassword
            );
            user = userCredential.user;
            console.log("✅ Usuario autenticado en Firebase Auth:", user.email);
          } catch (signInError: any) {
            console.error("❌ Error autenticando en Firebase Auth:", signInError);
            
            // Manejar errores específicos de Firebase Auth
            if (signInError.code === "auth/wrong-password" || signInError.code === "auth/invalid-credential") {
              throw new Error(savedLanguage === "es" 
                ? "La contraseña actual es incorrecta"
                : "Current password is incorrect");
            } else if (signInError.code === "auth/user-not-found") {
              throw new Error(savedLanguage === "es" 
                ? "Usuario no encontrado. Por favor, inicia sesión nuevamente."
                : "User not found. Please log in again.");
            } else if (signInError.code === "auth/too-many-requests") {
              throw new Error(savedLanguage === "es" 
                ? "Demasiados intentos. Por favor, espera un momento e intenta nuevamente."
                : "Too many attempts. Please wait a moment and try again.");
            } else {
              throw new Error(savedLanguage === "es" 
                ? "No se pudo autenticar. Por favor, verifica tu contraseña actual."
                : "Could not authenticate. Please verify your current password.");
            }
          }
        } catch (error: any) {
          // Si el error ya tiene un mensaje personalizado, lanzarlo tal cual
          if (error.message && (error.message.includes("contraseña") || error.message.includes("password"))) {
            throw error;
          }
          // Si es un error del backend, mostrar mensaje genérico
          console.error("❌ Error obteniendo datos del usuario:", error);
          throw new Error(savedLanguage === "es" 
            ? "No hay sesión activa. Por favor, inicia sesión nuevamente."
            : "No active session. Please log in again.");
        }
      } else {
        console.log("✅ Usuario ya autenticado en Firebase Auth:", user.email);
      }
      
      if (!user || !user.email) {
        throw new Error(savedLanguage === "es" 
          ? "No se pudo autenticar al usuario. Por favor, inicia sesión nuevamente."
          : "Could not authenticate user. Please log in again.");
      }
      
      // Verificar que el usuario tenga un token válido
      try {
        const firebaseToken = await user.getIdToken(false);
        if (!firebaseToken) {
          throw new Error("No se pudo obtener el token de Firebase");
        }
        console.log("✅ Token de Firebase obtenido correctamente");
      } catch (tokenError) {
        console.error("❌ Error obteniendo token de Firebase:", tokenError);
        // Intentar forzar renovación del token
        try {
          const refreshedToken = await user.getIdToken(true);
          if (!refreshedToken) {
            throw new Error("No se pudo renovar el token");
          }
          console.log("✅ Token renovado correctamente");
        } catch (refreshError) {
          console.error("❌ Error renovando token:", refreshError);
          throw new Error(savedLanguage === "es" 
            ? "No se pudo verificar la sesión. Por favor, inicia sesión nuevamente."
            : "Could not verify session. Please log in again.");
        }
      }

      // Verificar que el usuario tenga email
      if (!user.email) {
        console.error("❌ Usuario no tiene email");
        throw new Error(savedLanguage === "es" 
          ? "El usuario no tiene un correo electrónico asociado. No se puede cambiar la contraseña."
          : "User does not have an email associated. Cannot change password.");
      }

      // Verificar que el usuario tenga un proveedor de email/password
      const providers = user.providerData || [];
      const hasEmailProvider = providers.some(p => p.providerId === "password");
      
      if (!hasEmailProvider) {
        throw new Error(savedLanguage === "es" 
          ? "Este usuario se registró con Google. No se puede cambiar la contraseña desde aquí."
          : "This user registered with Google. Cannot change password from here.");
      }

      console.log("✅ Usuario autenticado:", user.email);
      console.log("🔄 Re-autenticando usuario con contraseña actual...");
      
      // 1) Re-autenticar con la contraseña actual
      // Esto valida que la contraseña actual sea correcta
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      try {
        await reauthenticateWithCredential(user, credential);
        console.log("✅ Re-autenticación exitosa - la contraseña actual es correcta");
      } catch (reauthError: any) {
        console.error("❌ Error en re-autenticación:", reauthError);
        
        // Si la contraseña actual es incorrecta, mostrar error específico
        if (reauthError.code === "auth/wrong-password" || reauthError.code === "auth/invalid-credential") {
          throw new Error(savedLanguage === "es" 
            ? "La contraseña actual es incorrecta"
            : "Current password is incorrect");
        } else if (reauthError.code === "auth/too-many-requests") {
          throw new Error(savedLanguage === "es" 
            ? "Demasiados intentos. Espera un momento e intenta nuevamente."
            : "Too many attempts. Please wait a moment and try again.");
        } else {
          throw new Error(savedLanguage === "es" 
            ? "No se pudo verificar la contraseña actual. Por favor, inténtalo nuevamente."
            : "Could not verify current password. Please try again.");
        }
      }

      // 2) Actualizar contraseña en Firebase Auth
      // Esto actualiza la contraseña en Firebase, invalidando automáticamente la anterior
      console.log("🔄 Actualizando contraseña en Firebase Auth...");
      try {
        await updatePassword(user, newPassword);
        console.log("✅ Contraseña actualizada exitosamente en Firebase Auth");
        
        // 3) Forzar renovación del token para que refleje el cambio
        await user.getIdToken(true);
        console.log("✅ Token renovado después del cambio de contraseña");
        
        // 4) Actualizar el token en localStorage
        const newToken = await user.getIdToken();
        if (newToken && typeof window !== "undefined") {
          const { saveToken } = await import("@/lib/auth");
          saveToken(newToken);
          console.log("✅ Token actualizado en localStorage");
        }
      } catch (updateError: any) {
        console.error("❌ Error actualizando contraseña:", updateError);
        
        if (updateError.code === "auth/weak-password") {
          throw new Error(savedLanguage === "es" 
            ? "La nueva contraseña es muy débil"
            : "New password is too weak");
        } else if (updateError.code === "auth/requires-recent-login") {
          throw new Error(savedLanguage === "es" 
            ? "Por seguridad, necesitas iniciar sesión nuevamente antes de cambiar la contraseña"
            : "For security, you need to log in again before changing your password");
        } else {
          throw new Error(savedLanguage === "es" 
            ? "Error al actualizar la contraseña. Por favor, inténtalo nuevamente."
            : "Error updating password. Please try again.");
        }
      }

      setPasswordSuccess(savedLanguage === "es" ? "Contraseña cambiada correctamente" : "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error: any) {
      console.error("❌ Error changing password:", error);
      console.error("Error code:", error?.code);
      console.error("Error message:", error?.message);
      
      // Manejar errores específicos de Firebase
      if (error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
        setPasswordError(savedLanguage === "es" ? "La contraseña actual es incorrecta" : "Current password is incorrect");
      } else if (error?.code === "auth/weak-password") {
        setPasswordError(savedLanguage === "es" ? "La contraseña es muy débil" : "Password is too weak");
      } else if (error?.code === "auth/requires-recent-login") {
        setPasswordError(savedLanguage === "es" 
          ? "Por seguridad, necesitas iniciar sesión nuevamente antes de cambiar la contraseña"
          : "For security, you need to log in again before changing your password");
      } else if (error?.message?.includes("No hay sesión activa") || error?.message?.includes("not authenticated")) {
        setPasswordError(savedLanguage === "es" 
          ? "No hay sesión activa. Por favor, inicia sesión nuevamente."
          : "No active session. Please log in again.");
      } else {
        setPasswordError(error?.message || (savedLanguage === "es" ? "Error al cambiar la contraseña" : "Error changing password"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      initializeFirebase();
      if (!auth) {
        router.replace("/pages/login");
        return;
      }
      await signOut(auth);
      router.replace("/pages/login");
      setTimeout(() => window.location.replace("/pages/login"), 0);
    } catch (e) {
      alert("No se pudo cerrar sesión");
      console.error(e);
    }
  };

  const dev = (l: string) => alert(`${l}: en desarrollo`);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div>Cargando…</div>
      </div>
    );
  }

  // Aplicar estilos dinámicos según el tema guardado (no el temporal)
  const pageStyle = {
    ...styles.page,
    background: savedTheme === "dark" 
      ? "linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #0a0a0a 100%)"
      : "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
  };
  
  const containerStyle = {
    ...styles.container,
    width: isMobile ? "96vw" : "min(1180px, 96vw)",
    background: savedTheme === "dark" ? "#1a1a1a" : "#fff",
    color: savedTheme === "dark" ? "#ededed" : "#111827",
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* TOP BAR */}
        <header style={{
          ...styles.topbar,
          background: savedTheme === "dark" ? "#2a2a2a" : "transparent",
        }}>
          <button
            style={{
              ...styles.brandBtn,
              color: savedTheme === "dark" ? "#ededed" : "#0f2230",
            }}
            onClick={() => router.push("/pages/login/landing")}
          >
            MoveTogether
          </button>

          <div style={styles.fillBar}>
            <div style={styles.toolbar}>
              <button style={styles.iconBtn} onClick={() => dev("Mensajes")}>
                💬
              </button>
              <NotificationButton />
              <div style={styles.userPill}>
                <div style={styles.userCircle}>👤</div>
                <span>{userName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div
          style={{
            ...styles.body,
            gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
          }}
        >
          {/* SIDEBAR */}
          <aside style={{
            ...styles.sidebar,
            background: savedTheme === "dark" ? "#2a2a2a" : "#e5e7eb",
          }}>
            {[
              { label: "My trips", action: () => dev("My trips") },
              { label: "My Car", action: () => router.push("/pages/my-car") },
              { label: "My Profile", action: () => router.push("/pages/user") },
              { label: "Settings", action: () => {} },
              { label: "Help", action: () => router.push("/pages/help") },
            ].map((item) => (
              <button
                key={item.label}
                style={{
                  ...styles.sideItem,
                  backgroundColor: item.label === "Settings" ? "#d1d5db" : "transparent",
                }}
                onClick={item.action}
              >
                <span>{item.label}</span>
                <span style={{ fontWeight: 700 }}>+</span>
              </button>
            ))}
            <button style={styles.sideItem} onClick={handleLogout}>
              <span>Close session</span>
              <span style={{ fontWeight: 700 }}>+</span>
            </button>
          </aside>

          {/* MAIN */}
          <main style={styles.main}>
            <h2 style={{
              ...styles.sectionTitle,
              color: savedTheme === "dark" ? "#ededed" : "#0f2230",
            }}>
              {savedLanguage === "es" ? "Settings" : "Settings"}
            </h2>
            <p style={{
              ...styles.description,
              color: savedTheme === "dark" ? "#a0a0a0" : "#6b7280",
            }}>
              {savedLanguage === "es" 
                ? "Personaliza tu experiencia en MoveTogether." 
                : "Customize your MoveTogether experience."}
            </p>

            <section style={{
              ...styles.card,
              background: savedTheme === "dark" ? "#2a2a2a" : "#e5e7eb",
            }}>
              <div style={styles.settingItem}>
                <div style={{
                  ...styles.settingLabel,
                  color: savedTheme === "dark" ? "#ededed" : "#374151",
                }}>
                  Language
                </div>
                <select
                  style={{
                    ...styles.select,
                    background: savedTheme === "dark" ? "#1a1a1a" : "#fff",
                    color: savedTheme === "dark" ? "#ededed" : "#111827",
                    borderColor: savedTheme === "dark" ? "#444" : "#d1d5db",
                  }}
                  value={language}
                  onChange={(e) => {
                    // Solo actualizar el valor temporal, no aplicar
                    setLanguage(e.target.value as "es" | "en");
                  }}
                >
                  <option value="es" style={{ color: savedTheme === "dark" ? "#ededed" : "#111827", background: savedTheme === "dark" ? "#1a1a1a" : "#fff" }}>
                    Español 🇪🇸
                  </option>
                  <option value="en" style={{ color: savedTheme === "dark" ? "#ededed" : "#111827", background: savedTheme === "dark" ? "#1a1a1a" : "#fff" }}>
                    English 🇬🇧
                  </option>
                </select>
              </div>

              <div style={styles.settingItem}>
                <div style={{
                  ...styles.settingLabel,
                  color: savedTheme === "dark" ? "#ededed" : "#374151",
                }}>
                  Theme
                </div>
                <select
                  style={{
                    ...styles.select,
                    background: savedTheme === "dark" ? "#1a1a1a" : "#fff",
                    color: savedTheme === "dark" ? "#ededed" : "#111827",
                    borderColor: savedTheme === "dark" ? "#444" : "#d1d5db",
                  }}
                  value={theme}
                  onChange={(e) => {
                    // Solo actualizar el valor temporal, no aplicar
                    setTheme(e.target.value as "light" | "dark");
                  }}
                >
                  <option value="light" style={{ color: savedTheme === "dark" ? "#ededed" : "#111827", background: savedTheme === "dark" ? "#1a1a1a" : "#fff" }}>
                    Claro
                  </option>
                  <option value="dark" style={{ color: savedTheme === "dark" ? "#ededed" : "#111827", background: savedTheme === "dark" ? "#1a1a1a" : "#fff" }}>
                    Oscuro
                  </option>
                </select>
              </div>

              <div style={styles.settingItem}>
                <div style={{
                  ...styles.settingLabel,
                  color: savedTheme === "dark" ? "#ededed" : "#374151",
                }}>
                  {savedLanguage === "es" ? "Notifications" : "Notifications"}
                </div>
                <label style={{
                  ...styles.checkboxLabel,
                  color: savedTheme === "dark" ? "#ededed" : "#374151",
                }}>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => {
                      // Solo actualizar el valor temporal
                      setNotifications(e.target.checked);
                    }}
                    style={styles.checkbox}
                  />
                  <span>{savedLanguage === "es" ? "Activar notificaciones" : "Enable notifications"}</span>
                </label>
              </div>

              <div style={styles.settingItem}>
                <div style={{
                  ...styles.settingLabel,
                  color: savedTheme === "dark" ? "#ededed" : "#374151",
                }}>
                  {savedLanguage === "es" ? "Change Password" : "Change Password"}
                </div>
                <button
                  style={styles.passwordBtn}
                  onClick={async () => {
                    // Verificar autenticación antes de abrir el modal
                    try {
                      initializeFirebase();
                      
                      if (!auth) {
                        alert(savedLanguage === "es" 
                          ? "Firebase no está inicializado. Recarga la página."
                          : "Firebase is not initialized. Please reload the page.");
                        return;
                      }
                      
                      // Esperar un momento para que Firebase se inicialice
                      await new Promise(resolve => setTimeout(resolve, 200));
                      
                      const user = auth.currentUser;
                      
                      if (!user) {
                        alert(savedLanguage === "es" 
                          ? "No hay sesión activa. Por favor, inicia sesión nuevamente."
                          : "No active session. Please log in again.");
                        router.push("/pages/login");
                        return;
                      }
                      
                      // Verificar que el usuario tenga email/password como proveedor
                      const providers = user.providerData || [];
                      const hasEmailProvider = providers.some(p => p.providerId === "password");
                      
                      if (!hasEmailProvider) {
                        alert(savedLanguage === "es" 
                          ? "Este usuario se registró con Google. No se puede cambiar la contraseña desde aquí."
                          : "This user registered with Google. Cannot change password from here.");
                        return;
                      }
                      
                      // Si todo está bien, abrir el modal
                      setShowChangePasswordModal(true);
                    } catch (error) {
                      console.error("Error verificando autenticación:", error);
                      alert(savedLanguage === "es" 
                        ? "Error al verificar la sesión. Intenta nuevamente."
                        : "Error verifying session. Please try again.");
                    }
                  }}
                >
                  {savedLanguage === "es" ? "Cambiar contraseña" : "Change password"}
                </button>
              </div>

              {saveSuccess && (
                <div style={styles.success}>
                  {savedLanguage === "es" ? "✓ Configuración guardada correctamente" : "✓ Settings saved successfully"}
                </div>
              )}

              <div style={{
                ...styles.helpText,
                color: savedTheme === "dark" ? "#a0a0a0" : "#6b7280",
              }}>
                {savedLanguage === "es" 
                  ? "Cambia tus preferencias y presiona 'Guardar cambios' para aplicarlas."
                  : "Change your preferences and press 'Save changes' to apply them."}
              </div>

              <button
                style={styles.saveBtn}
                onClick={saveSettings}
              >
                {savedLanguage === "es" ? "Guardar cambios" : "Save changes"}
              </button>
            </section>
          </main>
        </div>
      </div>

      {/* MODAL PARA CAMBIAR CONTRASEÑA */}
      {showChangePasswordModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {savedLanguage === "es" ? "Cambiar contraseña" : "Change password"}
              </h3>
              <button
                style={styles.modalClose}
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordError("");
                  setPasswordSuccess("");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  {savedLanguage === "es" ? "Contraseña actual" : "Current password"}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={styles.formInput}
                  placeholder="••••••••"
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  {savedLanguage === "es" ? "Nueva contraseña" : "New password"}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.formInput}
                  placeholder="••••••••"
                />
                <div style={styles.hint}>
                  {savedLanguage === "es" 
                    ? "Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número"
                    : "Minimum 8 characters, must include uppercase, lowercase and number"}
                </div>
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  {savedLanguage === "es" ? "Confirmar nueva contraseña" : "Confirm new password"}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.formInput}
                  placeholder="••••••••"
                />
              </div>
              {passwordError && <div style={styles.error}>{passwordError}</div>}
              {passwordSuccess && <div style={styles.success}>{passwordSuccess}</div>}
              <div style={styles.modalActions}>
                <button
                  style={styles.cancelBtn}
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={saving}
                >
                  {savedLanguage === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button
                  style={styles.submitBtn}
                  onClick={handleChangePassword}
                  disabled={saving}
                >
                  {saving 
                    ? (savedLanguage === "es" ? "Guardando..." : "Saving...")
                    : (savedLanguage === "es" ? "Cambiar contraseña" : "Change password")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    padding: 24,
    display: "grid",
    placeItems: "center",
    transition: "background 0.3s ease",
  },
  container: {
    borderRadius: 12,
    boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
    overflow: "hidden",
    transition: "background 0.3s ease, color 0.3s ease",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 20,
  },
  brandBtn: {
    background: "none",
    border: "none",
    fontWeight: 800,
    fontSize: 20,
    color: "#0f2230",
    cursor: "pointer",
  },
  fillBar: {
    flex: 1,
    background: "#0b0b0b",
    borderRadius: 18,
    padding: 6,
    display: "flex",
    alignItems: "center",
  },
  toolbar: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "2px solid #fff",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
  },
  userPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
    padding: "0 10px",
  },
  userCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "#1e293b",
    display: "grid",
    placeItems: "center",
  },
  body: {
    display: "grid",
    gap: 20,
    padding: "0 20px 24px 20px",
    alignItems: "start",
  },
  sidebar: {
    background: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    display: "grid",
    gap: 8,
  },
  sideItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "transparent",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
  },
  main: {
    paddingRight: 6,
  },
  sectionTitle: {
    margin: "6px 0 10px 2px",
    fontSize: 22,
    fontWeight: 800,
    color: "#0f2230",
  },
  description: {
    margin: "0 0 20px 2px",
    fontSize: 14,
    color: "#6b7280",
  },
  card: {
    background: "#e5e7eb",
    borderRadius: 10,
    padding: 24,
    display: "grid",
    gap: 20,
  },
  settingItem: {
    display: "grid",
    gap: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },
  select: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    outline: "none",
    fontWeight: 500,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontSize: 14,
    color: "#374151",
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer",
  },
  passwordBtn: {
    background: "#0b5fff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    width: "fit-content",
  },
  helpText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
  saveBtn: {
    background: "#0b0b0b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    width: "fit-content",
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "grid",
    placeItems: "center",
    zIndex: 1000,
    padding: 20,
  },
  modalContent: {
    background: "#fff",
    borderRadius: 12,
    maxWidth: 500,
    width: "100%",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottom: "1px solid #e5e7eb",
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#0f2230",
  },
  modalClose: {
    background: "transparent",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    color: "#6b7280",
    width: 32,
    height: 32,
    display: "grid",
    placeItems: "center",
    borderRadius: 6,
  },
  modalBody: {
    padding: 20,
    display: "grid",
    gap: 16,
  },
  formField: {
    display: "grid",
    gap: 6,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },
  formInput: {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
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
  },
  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    color: "#374151",
  },
  submitBtn: {
    background: "#0b5fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    color: "#fff",
  },
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    color: "#333",
    fontWeight: 600,
  },
};

