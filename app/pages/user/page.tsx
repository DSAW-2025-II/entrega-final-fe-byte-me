"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ensureValidToken, clearTokens } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import MapPicker from "@/components/MapPicker";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function UserPage() {
  const router = useRouter();
  const { theme, language } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [me, setMe] = useState({
    user_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    user_photo: "",
    city: "",
    address: "",
    nearby_landmark: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mapMode, setMapMode] = useState<"city" | "address" | "landmark" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkMedia = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkMedia();
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    
    const onMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const onTablet = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    
    mqMobile.addEventListener("change", onMobile);
    mqTablet.addEventListener("change", onTablet);
    
    window.addEventListener("resize", checkMedia);
    
    return () => {
      mqMobile.removeEventListener("change", onMobile);
      mqTablet.removeEventListener("change", onTablet);
      window.removeEventListener("resize", checkMedia);
    };
  }, []);

  const fetchUserData = async () => {
      try {
        const validToken = await ensureValidToken();
        if (!validToken) {
          router.push("/pages/login");
          return;
        }

        const userData = await api.get("/api/me", validToken);
        if (userData) {
          setMe({
            user_id: userData.user_id || userData.uid || "",
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            user_photo: userData.user_photo || "",
            city: userData.city || "",
            address: userData.address || "",
            nearby_landmark: userData.nearby_landmark || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/pages/login");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchUserData();
  }, [router]);

  const fullName =
    `${me.first_name || ""} ${me.last_name || ""}`.trim() || "Usuario";

  const dev = (l: string) => alert(`${l}: en desarrollo`);

  // ---- Guardar cambios del perfil ----
  const handleSave = async () => {
    try {
      const validToken = await ensureValidToken();
      if (!validToken) {
        alert("Sesión expirada. Por favor inicia sesión nuevamente.");
        router.push("/pages/login");
        return;
      }

      // Actualizar datos en Firestore
      const response = await api.post(
        "/api/register",
        {
          isUpdate: true,
          user_id: me.user_id,
          email: me.email,
          first_name: me.first_name,
          last_name: me.last_name,
          phone: me.phone,
          city: me.city,
          address: me.address,
          nearby_landmark: me.nearby_landmark,
        },
        validToken
      );

      if (response) {
        setIsEditing(false);
        // Recargar datos del usuario para mostrar los cambios guardados
        await fetchUserData();
        alert("Perfil actualizado correctamente");
      }
    } catch (error: any) {
      console.error("Error guardando perfil:", error);
      alert("Error al guardar el perfil. Intenta nuevamente.");
    }
  };

  // ---- Cerrar sesión y bloquear volver ----
  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      clearTokens();
      router.replace("/pages/login");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.replace("/pages/login");
        }
      }, 100);
    } catch (e) {
      alert("No se pudo cerrar sesión");
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div>Cargando…</div>
      </div>
    );
  }

  // Aplicar estilos dinámicos según el tema
  const pageStyle = {
    ...styles.page,
    padding: isMobile ? "16px 12px" : "32px 24px",
    background: theme === "dark" 
      ? "linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #0a0a0a 100%)"
      : "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
  };
  
  const containerStyle = {
    ...styles.container,
    background: theme === "dark" ? "#1a1a1a" : "#fff",
    color: theme === "dark" ? "#ededed" : "#111827",
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* TOP BAR */}
        <header style={{
          ...styles.topbar,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 12 : 12,
          padding: isMobile ? "16px" : "20px",
          background: theme === "dark" ? "#2a2a2a" : "transparent",
        }}>
          <button
            style={{
              ...styles.brandBtn,
              color: theme === "dark" ? "#ededed" : "#0f2230",
            }}
            onClick={() => router.push("/pages/login/landing")}
          >
            MoveTogether
          </button>

          {/* Barra azul que ocupa el espacio restante */}
          <div style={{
            ...styles.fillBar,
            width: isMobile ? "100%" : "auto",
          }}>
            <div style={{
              ...styles.toolbar,
              marginLeft: isMobile ? "0" : "auto",
              justifyContent: isMobile ? "center" : "flex-end",
            }}>
              <button
                style={styles.iconBtn}
                onClick={() => dev("Mensajes")}
                title="Mensajes"
              >
                💬
              </button>
              <button
                style={styles.iconBtn}
                onClick={() => dev("Notificaciones")}
                title="Notificaciones"
              >
                🔔
              </button>
              <div style={{
                ...styles.userPill,
                display: isMobile ? "none" : "flex",
              }}>
                <div style={styles.userCircle}>👤</div>
                <span>{fullName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div
          style={{
            ...styles.body,
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "180px 1fr" : "220px 1fr",
            gap: isMobile ? 16 : 24,
            padding: isMobile ? "0 16px 24px 16px" : "0 28px 32px 28px",
          }}
        >
          {/* SIDEBAR */}
          <aside style={{
            ...styles.sidebar,
            display: isMobile ? "flex" : "grid",
            flexDirection: isMobile ? "row" : "column",
            overflowX: isMobile ? "auto" : "visible",
            gap: isMobile ? 8 : 8,
            padding: isMobile ? "12px" : "14px",
            background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
          }}>
            {[
              { label: "My trips", action: () => dev("My trips"), path: "/pages/trips" },
              { label: "My Car", action: () => router.push("/pages/my-car"), path: "/pages/my-car" },
              { label: "My Profile", action: () => {}, path: "/pages/user" },
              { label: "Settings", action: () => router.push("/pages/settings"), path: "/pages/settings" },
              { label: "Help", action: () => router.push("/pages/help"), path: "/pages/help" },
            ].map((item) => {
              const isActive = typeof window !== "undefined" && window.location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  style={{
                    ...styles.sideItem,
                    whiteSpace: isMobile ? "nowrap" : "normal",
                    minWidth: isMobile ? "120px" : "auto",
                    backgroundColor: isActive ? "#d1d5db" : "transparent",
                  }}
                  onClick={item.action}
                >
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 700 }}>+</span>
                </button>
              );
            })}
            {/* Cerrar sesión real */}
            <button style={{
              ...styles.sideItem,
              whiteSpace: isMobile ? "nowrap" : "normal",
              minWidth: isMobile ? "120px" : "auto",
            }} onClick={handleLogout}>
              <span>Close session</span>
              <span style={{ fontWeight: 700 }}>+</span>
            </button>
          </aside>

          {/* MAIN */}
          <main style={{
            ...styles.main,
            paddingRight: isMobile ? 0 : 6,
          }}>
            <h2 style={{
              ...styles.sectionTitle,
              fontSize: isMobile ? 20 : 22,
              color: theme === "dark" ? "#ededed" : "#0f2230",
            }}>My profile</h2>

            {/* HEADER CARD */}
            <section style={{
              ...styles.cardWide,
              padding: isMobile ? "16px" : "24px",
              background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
            }}>
              <div style={{
                ...styles.headerRow,
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 16 : 16,
                alignItems: isMobile ? "center" : "flex-start",
                textAlign: isMobile ? "center" : "left",
              }}>
                <div style={styles.avatarWrap}>
                  {me.user_photo ? (
                    <img
                      src={me.user_photo}
                      alt="avatar"
                      style={styles.avatar}
                    />
                  ) : (
                    <div style={styles.avatarFallback}>👤</div>
                  )}
                  <button
                    style={styles.camBtn}
                    onClick={() => dev("Cambiar foto")}
                    title="Cambiar foto"
                  >
                    📷
                  </button>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{
                    ...styles.nameText,
                    color: theme === "dark" ? "#ededed" : "#0f2230",
                  }}>{fullName}</div>
                  <div style={{
                    ...styles.muted,
                    color: theme === "dark" ? "#a0a0a0" : "#475569",
                  }}>{me.email || "—"}</div>
                  <div style={{
                    ...styles.muted,
                    color: theme === "dark" ? "#a0a0a0" : "#475569",
                  }}>{me.phone || "—"}</div>
                </div>
              </div>
            </section>

            {/* DETAILS */}
            <section style={{
              ...styles.cardWide,
              background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
            }}>
              <div style={styles.cardHeader}>
                <div />
                {isEditing ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{
                        ...styles.editBtn,
                        background: "#6b7280",
                      }}
                      onClick={() => {
                        setIsEditing(false);
                        // Recargar datos originales
                        fetchUserData();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      style={styles.editBtn}
                      onClick={handleSave}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    style={styles.editBtn}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                )}
              </div>

              <div
                style={{
                  ...styles.grid3,
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : isTablet
                    ? "repeat(2, 1fr)"
                    : "repeat(3, 1fr)",
                }}
              >
                <Field
                  label="First name"
                  value={me.first_name || "—"}
                  editable={isEditing}
                  onChange={(value) => setMe({ ...me, first_name: value })}
                />
                <Field
                  label="Last name"
                  value={me.last_name || "—"}
                  editable={isEditing}
                  onChange={(value) => setMe({ ...me, last_name: value })}
                />
                <Field
                  label="Institutional email"
                  value={me.email || "—"}
                  editable={false}
                />
                <Field
                  label="ID"
                  value={me.user_id || "—"}
                  editable={false}
                />
                <Field
                  label="Phone number"
                  value={me.phone || "—"}
                  editable={isEditing}
                  onChange={(value) => setMe({ ...me, phone: value })}
                />
                <Field
                  label="City"
                  value={me.city || ""}
                  editable={isEditing}
                  onChange={(value) => setMe({ ...me, city: value })}
                  isPlaceAutocomplete={true}
                  onSelectFromMap={() => setMapMode("city")}
                />
                <Field
                  label="Address"
                  value={me.address || ""}
                  editable={isEditing}
                  onChange={(value) => setMe({ ...me, address: value })}
                  isPlaceAutocomplete={true}
                  onSelectFromMap={() => setMapMode("address")}
                />
                <Field
                  label="Nearby landmark"
                  value={me.nearby_landmark || ""}
                  editable={isEditing}
                  onChange={(value) => setMe({ ...me, nearby_landmark: value })}
                  isPlaceAutocomplete={true}
                  onSelectFromMap={() => setMapMode("landmark")}
                />
              </div>
            </section>
          </main>
        </div>
      </div>
      
      {/* Modal para selección desde mapa */}
      {mapMode && (
        <div style={styles.mapModal}>
          <div style={styles.mapModalContent}>
            <div style={styles.mapModalHeader}>
              <h3 style={styles.mapModalTitle}>
                Seleccionar {mapMode === "city" ? "Ciudad" : mapMode === "address" ? "Dirección" : "Punto de referencia"} desde el mapa
              </h3>
              <button
                style={styles.mapModalClose}
                onClick={() => setMapMode(null)}
              >
                ✕
              </button>
            </div>
            <div style={styles.mapModalMap}>
              <MapPicker
                onPlaceSelect={(place) => {
                  if (mapMode === "city") {
                    setMe({ ...me, city: place.address });
                  } else if (mapMode === "address") {
                    setMe({ ...me, address: place.address });
                  } else if (mapMode === "landmark") {
                    setMe({ ...me, nearby_landmark: place.address });
                  }
                  setMapMode(null);
                }}
                mode="from"
                height="500px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  editable = false,
  onChange,
  isPlaceAutocomplete = false,
  onSelectFromMap,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  isPlaceAutocomplete?: boolean;
  onSelectFromMap?: () => void;
}) {
  if (editable && isPlaceAutocomplete) {
    return (
      <div style={styles.field}>
        <div style={styles.fieldLabel}>{label}</div>
        <PlaceAutocomplete
          value={value}
          onChange={(val) => onChange?.(val)}
          onSelect={(place) => {
            onChange?.(place.address);
          }}
          onSelectFromMap={onSelectFromMap}
          placeholder={`Buscar ${label.toLowerCase()}...`}
        />
      </div>
    );
  }

  if (editable) {
    return (
      <div style={styles.field}>
        <div style={styles.fieldLabel}>{label}</div>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          style={styles.fieldInput}
          placeholder={`Ingresa ${label.toLowerCase()}`}
        />
      </div>
    );
  }

  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{value || "—"}</div>
    </div>
  );
}

/* -------- STYLES -------- */
const styles: { [k: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
    padding: "16px 12px",
    display: "grid",
    placeItems: "center",
  },
  container: {
    width: "min(1400px, 98vw)",
    maxWidth: "1400px",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 18px 60px rgba(0,0,0,.18)",
    overflow: "hidden",
    margin: "0 auto",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 20,
    flexWrap: "wrap",
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
    gap: 24,
    padding: "0 28px 32px 28px",
    alignItems: "start",
  },
  sidebar: {
    background: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    display: "grid",
    gap: 8,
    minHeight: "fit-content",
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
    transition: "background-color 0.2s",
  },
  main: { paddingRight: 6 },
  sectionTitle: {
    margin: "6px 0 10px 2px",
    fontSize: 22,
    fontWeight: 800,
    color: "#0f2230",
  },
  cardWide: {
    background: "#e5e7eb",
    borderRadius: 12,
    padding: 24,
    display: "grid",
    gap: 18,
    marginBottom: 18,
  },
  headerRow: { display: "flex", alignItems: "center", gap: 16 },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editBtn: {
    background: "#0b5fff",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "6px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  avatarWrap: { display: "flex", alignItems: "center", gap: 14 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #fff",
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#1f2937",
    color: "#fff",
    fontSize: 28,
  },
  camBtn: {
    marginLeft: -8,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
  },
  nameText: { fontSize: 18, fontWeight: 800 },
  muted: { fontSize: 14 },
  grid3: { display: "grid", gap: 14 },
  field: {
    background: "#f3f4f6",
    borderRadius: 10,
    padding: 14,
    display: "grid",
    gap: 2,
  },
  fieldLabel: { fontSize: 12, color: "#6b7280" },
  fieldValue: { fontSize: 14, fontWeight: 700, color: "#111827" },
  fieldInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    background: "#fff",
    outline: "none",
  },
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    color: "#333",
    fontWeight: 600,
  },
  mapModal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "grid",
    placeItems: "center",
    zIndex: 10000,
    padding: "20px",
  },
  mapModalContent: {
    background: "#fff",
    borderRadius: 12,
    width: "min(900px, 95vw)",
    maxHeight: "90vh",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    overflow: "hidden",
  },
  mapModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #e5e7eb",
  },
  mapModalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#0f2230",
  },
  mapModalClose: {
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
  mapModalMap: {
    padding: "20px",
    overflow: "auto",
  },
};

