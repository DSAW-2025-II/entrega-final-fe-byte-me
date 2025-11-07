"use client";

import Image from "next/image";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import MapPicker from "@/components/MapPicker";

const TRIP_DRAFT_STORAGE_KEY = "movetogether_tripDraft";

export default function LandingPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para lugares
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromCoord, setFromCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoord, setToCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMode, setMapMode] = useState<"from" | "to">("from");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  // Fecha mínima (hoy)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Verificar y obtener token válido
        const validToken = await ensureValidToken();
        if (!validToken) {
          // Si no hay token válido, redirigir al login
          router.push("/pages/login");
          return;
        }

        // Obtener datos del usuario desde Firestore usando /api/me
        try {
          const result = await api.get("/api/me", validToken);
          if (result && (result.first_name || result.email)) {
            console.log("Usuario obtenido de Firestore:", result);
            console.log("Foto del usuario:", result.user_photo);
            setUserData(result);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.log("No se encontró usuario en Firestore, intentando Firebase Auth...", apiError);
        }

        // Si no hay datos en Firestore, obtener de Firebase Auth
        try {
          const { auth, initializeFirebase } = await import("@/lib/firebase");
          const { onAuthStateChanged } = await import("firebase/auth");
          
          // Asegurar que Firebase esté inicializado
          initializeFirebase();
          
          if (!auth) {
            setLoading(false);
            return;
          }
          
          onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
              const nameParts = (currentUser.displayName || "").split(" ");
              setUserData({
                first_name: nameParts[0] || "",
                last_name: nameParts.slice(1).join(" ") || "",
                user_photo: currentUser.photoURL || null,
              });
            }
            setLoading(false);
          });
        } catch (firebaseError) {
          console.error("Error obteniendo usuario de Firebase:", firebaseError);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const userName = userData 
    ? `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "Usuario"
    : "Camila Reyes";
  
  // Asegurar que user_photo no sea Group27.png
  let userPhoto = userData?.user_photo || null;
  if (userPhoto) {
    // Filtrar cualquier referencia a Group27
    if (userPhoto.includes("Group27") || userPhoto.includes("group-27") || userPhoto === "/Group27.png" || userPhoto === "/group-27.png") {
      console.warn("Detectada foto incorrecta (Group27), ignorando...");
      userPhoto = null;
    } else {
      console.log("Foto del usuario válida:", userPhoto.substring(0, 50) + "...");
    }
  }
  
  console.log("Foto final a mostrar:", userPhoto ? "Foto válida" : "Sin foto");

  return (
    <div style={styles.page}> 
      {/* BARRA SUPERIOR */}
      <header style={styles.topbar}>
        <div style={styles.topbarContent}>
          <div style={styles.brand}>MoveTogether</div>
          <button
            style={{
              ...styles.user,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() => router.push("/pages/user")}
            title="Ver perfil"
          >
            <div style={styles.userAvatarContainer}>
              {userPhoto ? (
                <Image
                  src={userPhoto}
                  alt="User avatar"
                  fill
                  style={{ objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                <div style={styles.userAvatar} />
              )}
            </div>
            <span style={styles.userName}>{userName}</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main style={styles.main}> 
        {/* IZQUIERDA: FORM/CTA */}
        <section style={styles.left}> 
          <h1 style={styles.heroTitle}>
            Ride together,
            <br />
            study together.
          </h1>

          <div style={styles.form}>
                <label style={styles.label}>Punto de partida</label>
                <div style={styles.inputWithIcon}> 
                  <PlaceAutocomplete
                    value={from}
                    onChange={setFrom}
                    onSelect={(place) => {
                      setFrom(place.address);
                      setFromCoord({ lat: place.lat, lng: place.lng });
                    }}
                    onSelectFromMap={() => {
                      setMapMode("from");
                      // Opcional: hacer scroll al mapa
                      document.querySelector('[data-map-container]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    placeholder="Buscar punto de partida..."
                  />
                  <span style={styles.paperPlane} aria-hidden>✈️</span>
                </div>

                <label style={styles.label}>Destino</label>
                <div style={styles.inputWithIcon}>
                  <PlaceAutocomplete
                    value={to}
                    onChange={setTo}
                    onSelect={(place) => {
                      setTo(place.address);
                      setToCoord({ lat: place.lat, lng: place.lng });
                    }}
                    onSelectFromMap={() => {
                      setMapMode("to");
                      // Opcional: hacer scroll al mapa
                      document.querySelector('[data-map-container]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    placeholder="Buscar destino..."
                  />
                  <span style={styles.dropdownArrow} aria-hidden>🎯</span>
                </div>
            
            {/* Modo de selección en mapa */}
            <div style={styles.mapModeContainer}>
              <div style={styles.mapModeLabel}>Click en el mapa para seleccionar:</div>
              <div style={styles.mapModeButtons}>
                <button
                  type="button"
                  style={{
                    ...styles.mapModeBtn,
                    ...(mapMode === "from" ? styles.mapModeBtnActive : {}),
                  }}
                  onClick={() => setMapMode("from")}
                >
                  ✈️ Origen
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.mapModeBtn,
                    ...(mapMode === "to" ? styles.mapModeBtnActive : {}),
                  }}
                  onClick={() => setMapMode("to")}
                >
                  🎯 Destino
                </button>
              </div>
            </div>

            <div style={styles.row2}> 
              <div style={styles.half}> 
                <label style={styles.smallLabel}>Fecha</label>
                <input
                  type="date"
                  style={styles.dateInput}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                />
              </div>
              <div style={styles.half}> 
                <label style={styles.smallLabel}>Hora</label>
                <div style={styles.inputWithIcon}>
                  <select
                    style={styles.hourSelect}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  >
                    <option value="">Seleccionar hora</option>
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                  </select>
                  <span style={styles.dropdownArrow} aria-hidden>▼</span>
                </div>
              </div>
            </div>
            
            {/* Mostrar coordenadas si están seleccionadas */}
            {(fromCoord || toCoord) && (
              <div style={styles.coordsContainer}>
                {fromCoord && (
                  <div style={styles.coordItem}>
                    ✈️ Origen: {fromCoord.lat.toFixed(4)}, {fromCoord.lng.toFixed(4)}
                  </div>
                )}
                {toCoord && (
                  <div style={styles.coordItem}>
                    🎯 Destino: {toCoord.lat.toFixed(4)}, {toCoord.lng.toFixed(4)}
                  </div>
                )}
              </div>
            )}

            <div style={styles.buttonsRow}>
              <button
                style={styles.primaryBtn}
                onClick={() => {
                  if (!from || !to) {
                    alert("Por favor selecciona el punto de partida y destino");
                    return;
                  }
                  if (!fromCoord || !toCoord) {
                    alert("Por favor selecciona los puntos en el mapa o usando el autocompletado");
                    return;
                  }
                  if (!date) {
                    alert("Selecciona la fecha de salida");
                    return;
                  }
                  if (!time) {
                    alert("Selecciona la hora de salida");
                    return;
                  }

                  const draft = {
                    from,
                    to,
                    fromCoord,
                    toCoord,
                    date,
                    time,
                  };

                  if (typeof window !== "undefined") {
                    sessionStorage.setItem(TRIP_DRAFT_STORAGE_KEY, JSON.stringify(draft));
                  }

                  router.push("/pages/trips/create");
                }}
              >
                Wheels me
              </button>
              <button style={styles.secondaryBtn}>My trips</button>
            </div>
          </div>
        </section>

            {/* DERECHA: MAPA INTERACTIVO */}
            <aside style={styles.right}> 
              <div style={styles.mapContainer} data-map-container>
                <MapPicker
                  onPlaceSelect={(place) => {
                    if (mapMode === "from") {
                      setFrom(place.address);
                      setFromCoord({ lat: place.lat, lng: place.lng });
                    } else {
                      setTo(place.address);
                      setToCoord({ lat: place.lat, lng: place.lng });
                    }
                  }}
                  mode={mapMode}
                  fromCoord={fromCoord}
                  toCoord={toCoord}
                  height="640px"
                />
              </div>
            </aside>
      </main>
    </div>
  );
}

const styles: { [k: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#0e2230",
    display: "flex",
    flexDirection: "column",
  },
  topbar: {
    background: "#0b1b27",
    height: 56,
    display: "flex",
    alignItems: "center",
    boxShadow: "0 1px 0 rgba(255,255,255,0.06)",
  },
  topbarContent: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#fff",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  },
  brand: {
    fontWeight: 600,
    letterSpacing: 0.2,
  },
  user: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#cfe2f2",
  },
  userAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    position: "relative" as const,
    overflow: "hidden",
    flexShrink: 0,
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#183346",
  },
  userName: {
    fontSize: 12,
  },
  main: {
    width: "100%",
    maxWidth: 1200,
    margin: "28px auto",
    display: "grid",
    gridTemplateColumns: "1fr 520px",
    gap: 40,
    padding: "0 20px",
  },
  left: {
    background: "#fff",
    borderRadius: 12,
    padding: 32,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: 640,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  heroTitle: {
    fontSize: 48,
    lineHeight: "56px",
    fontWeight: 700,
    margin: 0,
    marginBottom: 28,
    color: "#0b1b27",
  },
  form: {
    display: "grid",
    gap: 12,
    maxWidth: 460,
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#e9eaeb",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
  },
  select: {
    width: "100%",
    height: 44,
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#e9eaeb",
    padding: "0 14px",
    paddingRight: "40px",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    MozAppearance: "none" as const,
    color: "#111827",
    fontWeight: 500,
  },
  inputWithIcon: {
    position: "relative",
  },
  paperPlane: {
    position: "absolute",
    right: 32,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 16,
    opacity: 0.6,
    pointerEvents: "none" as const,
  },
  dropdownArrow: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 10,
    opacity: 0.5,
    pointerEvents: "none" as const,
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 6,
  },
  half: {
    display: "grid",
    gap: 6,
  },
  smallLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  smallInput: {
    height: 40,
    borderRadius: 6,
    background: "#e9eaeb",
    border: "1px solid #ddd",
    fontSize: 14,
    color: "#111827",
    cursor: "pointer",
  },
  dateInput: {
    height: 40,
    borderRadius: 6,
    background: "#e9eaeb",
    border: "1px solid #ddd",
    fontSize: 14,
    color: "#111827",
    padding: "0 12px",
    outline: "none",
    cursor: "pointer",
  },
  hourSelect: {
    height: 40,
    borderRadius: 6,
    background: "#e9eaeb",
    border: "1px solid #ddd",
    fontSize: 14,
    color: "#111827",
    padding: "0 12px",
    paddingRight: "32px",
    outline: "none",
    cursor: "pointer",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    MozAppearance: "none" as const,
    fontWeight: 500,
    position: "relative" as const,
  },
  buttonsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 8,
  },
  primaryBtn: {
    height: 40,
    borderRadius: 8,
    border: "none",
    background: "#0b1b27",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    height: 40,
    borderRadius: 8,
    border: "1px solid #cfd8e3",
    background: "#fff",
    color: "#111827",
    fontWeight: 600,
    cursor: "pointer",
  },
  right: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: {
    minHeight: "640px",
    width: 520,
    height: 640,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: 520,
    height: 640,
    background: "linear-gradient(180deg, #2b5b86 0%, #326aa0 100%)",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    position: "relative" as const,
  },
  imageContainer: {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginTop: 8,
    fontWeight: 500,
  },
  mapModeContainer: {
    marginTop: 12,
    padding: 12,
    background: "#f8f9fa",
    borderRadius: 8,
    border: "1px solid #e9ecef",
  },
  mapModeLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 8,
  },
  mapModeButtons: {
    display: "flex",
    gap: 8,
  },
  mapModeBtn: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #dee2e6",
    background: "#fff",
    color: "#495057",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  mapModeBtnActive: {
    background: "#0b1b27",
    color: "#fff",
    borderColor: "#0b1b27",
  },
  coordsContainer: {
    marginTop: 8,
    padding: 10,
    background: "#f8f9fa",
    borderRadius: 6,
    fontSize: 12,
    color: "#6c757d",
    display: "grid",
    gap: 6,
  },
  coordItem: {
    fontSize: 11,
    fontFamily: "monospace",
  },
};

