"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import Image from "next/image";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useUser } from "@/app/contexts/UserContext";

interface Trip {
  trip_id: string;
  start?: {
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  destination?: {
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  time?: string;
  seats?: number;
  fare?: number;
  status?: string;
  driver?: {
    name?: string;
    photo?: string;
  };
  driver_uid?: string;
  waitlist?: string[];
  vehicle?: {
    model?: string;
    license_plate?: string;
  };
  createdAt?: string;
}

export default function MyTripsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
  const [passengerTrips, setPassengerTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState<"conductor" | "pasajero">("conductor");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateMedia = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    updateMedia();
    window.addEventListener("resize", updateMedia);

    return () => {
      window.removeEventListener("resize", updateMedia);
    };
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await ensureValidToken();
        if (!token) {
          router.push("/pages/login");
          return;
        }

        // Obtener datos del usuario (para uid y user_id)
        const meResponse = await api.get("/api/me", token);
        console.log("👤 MyTrips /api/me response:", meResponse);
        if (meResponse) {
          setUserData(meResponse);
        }

        // Viajes donde el usuario es CONDUCTOR
        const driverResp = await api.get("/api/trips", token);
        if (driverResp && Array.isArray(driverResp.trips)) {
          setDriverTrips(driverResp.trips);
        } else {
          setDriverTrips([]);
        }

        // Viajes donde el usuario es PASAJERO usando my_trips del usuario
        if (meResponse?.my_trips && Array.isArray(meResponse.my_trips) && meResponse.my_trips.length > 0) {
          const myTripIds: string[] = meResponse.my_trips;
          const query = encodeURIComponent(myTripIds.join(","));
          const passengerResp = await api.get(`/api/trips?ids=${query}`, token);
          console.log("🚌 MyTrips passenger trips resp:", passengerResp);
          if (passengerResp && Array.isArray(passengerResp.trips)) {
            setPassengerTrips(passengerResp.trips);
          } else {
            setPassengerTrips([]);
          }
        } else {
          setPassengerTrips([]);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err?.message || "No se pudieron cargar los viajes");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatDateTime = (iso: string) => {
    try {
      const dateObj = new Date(iso);
      const dateString = dateObj.toLocaleDateString("es-CO", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeString = dateObj.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dateString} • ${timeString}`;
    } catch {
      return iso;
    }
  };

  const fullName = useMemo(() => {
    const base = userData || user;
    if (!base) return "Usuario";
    const first = base.first_name || "";
    const last = base.last_name || "";
    const name = `${first} ${last}`.trim();
    const email = base.email || (base.user_email ?? "");
    return name || (email ? email.split("@")[0] : "Usuario");
  }, [userData, user]);

  const filteredTrips = useMemo(() => {
    if (activeTab === "conductor") {
      return driverTrips;
    }
    return passengerTrips;
  }, [activeTab, driverTrips, passengerTrips]);

  const pageStyle = useMemo(
    () => ({
      ...styles.page,
      background:
        theme === "dark"
          ? "linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #0a0a0a 100%)"
          : "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
      padding: isMobile ? "16px 12px" : "32px 24px",
    }),
    [theme, isMobile]
  );

  const containerStyle = useMemo(
    () => ({
      ...styles.container,
      background: theme === "dark" ? "#1a1a1a" : "#fff",
      color: theme === "dark" ? "#ededed" : "#111827",
    }),
    [theme]
  );

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingCard}>Cargando viajes…</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header
          style={{
            ...styles.topbar,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 12 : 12,
            padding: isMobile ? "16px" : "20px",
            background: theme === "dark" ? "#2a2a2a" : "transparent",
          }}
        >
          <div
            style={{
              ...styles.brandBtn,
              color: theme === "dark" ? "#ededed" : "#0f2230",
            }}
          >
            MoveTogether
          </div>
          <button
            style={{
              ...styles.backButton,
              color: theme === "dark" ? "#ededed" : "#0f2230",
              borderColor: theme === "dark" ? "#475569" : "#d1d5db",
            }}
            onClick={() => router.push("/pages/login/landing")}
          >
            ← Volver
          </button>

          <div style={{ ...styles.fillBar, width: isMobile ? "100%" : "auto" }}>
            <div style={{ ...styles.toolbar, marginLeft: "auto" }}>
              <button style={styles.iconBtn} title="Mensajes">
                💬
              </button>
              <button style={styles.iconBtn} title="Notificaciones">
                🔔
              </button>
            </div>
            <button
              style={{
                ...styles.userHeaderButton,
                marginLeft: isMobile ? 0 : 12,
                background: theme === "dark" ? "#0f2230" : "#0f2230",
                color: "#fff",
              }}
              onClick={() => router.push("/pages/user")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === "dark" ? "#102a4a" : "#12263a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0f2230";
              }}
            >
              <div style={{ ...styles.userHeaderAvatar, background: "#1e293b" }}>
                {userData?.user_photo || user?.user_photo ? (
                  <Image
                    src={userData?.user_photo || user?.user_photo}
                    alt="avatar"
                    fill
                    style={{ objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  <div style={styles.userHeaderAvatarFallback}>👤</div>
                )}
              </div>
              <span style={{ ...styles.userHeaderName, color: "#fff" }}>{fullName}</span>
            </button>
          </div>
        </header>

        <div
          style={{
            ...styles.body,
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "200px 1fr"
              : "230px 1fr",
            gap: isMobile ? 16 : 24,
            padding: isMobile ? "0 16px 24px 16px" : "0 28px 32px 28px",
          }}
        >
          <aside
            style={{
              ...styles.sidebar,
              display: isMobile ? "flex" : "grid",
              flexDirection: isMobile ? "row" : "column",
              overflowX: isMobile ? "auto" : "visible",
              gap: isMobile ? 8 : 8,
              padding: isMobile ? "12px" : "14px",
              background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
            }}
          >
            {[
              { label: "My trips", path: "/pages/trips", action: () => {} },
              { label: "My Car", path: "/pages/my-car", action: () => router.push("/pages/my-car") },
              { label: "My Profile", path: "/pages/user", action: () => router.push("/pages/user") },
              { label: "Settings", path: "/pages/settings", action: () => router.push("/pages/settings") },
              { label: "Help", path: "/pages/help", action: () => router.push("/pages/help") },
              { label: "Close session", path: "/pages/login", action: () => router.push("/pages/login") },
            ].map((item) => {
              const isActive = item.path === "/pages/trips";
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
                  disabled={isActive}
                >
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 700 }}>+</span>
                </button>
              );
            })}
          </aside>

          <main
            style={{
              ...styles.main,
              paddingRight: isMobile ? 0 : 6,
            }}
          >
            <h2
              style={{
                ...styles.sectionTitle,
                fontSize: isMobile ? 20 : 22,
                color: theme === "dark" ? "#ededed" : "#0f2230",
              }}
            >
              My trips
            </h2>

            <div style={styles.tabsContainer}>
              <div
                style={{
                  ...styles.tabsWrapper,
                  background: theme === "dark" ? "#1a1a1a" : "#f1f5f9",
                }}
              >
                <button
                  type="button"
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === "conductor" ? styles.tabButtonActive : {}),
                    color: activeTab === "conductor" 
                      ? (theme === "dark" ? "#ededed" : "#0f2230")
                      : (theme === "dark" ? "#a0a0a0" : "#64748b"),
                  }}
                  onClick={() => setActiveTab("conductor")}
                >
                  Conductor
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === "pasajero" ? styles.tabButtonActive : {}),
                    color: activeTab === "pasajero"
                      ? (theme === "dark" ? "#ededed" : "#0f2230")
                      : (theme === "dark" ? "#a0a0a0" : "#64748b"),
                  }}
                  onClick={() => setActiveTab("pasajero")}
                >
                  Pasajero
                </button>
                <div
                  style={{
                    ...styles.tabIndicator,
                    transform: activeTab === "conductor" ? "translateX(0)" : "translateX(100%)",
                    background: theme === "dark" ? "#2a2a2a" : "#ffffff",
                    boxShadow: theme === "dark" 
                      ? "0 1px 3px rgba(0, 0, 0, 0.3)" 
                      : "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </div>
            </div>

            {userData && (
              <section
                style={{
                  ...styles.cardWide,
                  padding: isMobile ? "16px" : "24px",
                  background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
                }}
              >
                <div
                  style={{
                    ...styles.headerRow,
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 16 : 16,
                    alignItems: isMobile ? "center" : "flex-start",
                    textAlign: isMobile ? "center" : "left",
                  }}
                >
                  <div style={styles.avatarWrap}>
                    {userData?.user_photo || user?.user_photo ? (
                      <Image
                        src={userData?.user_photo || user?.user_photo}
                        alt="avatar"
                        fill
                        style={{ objectFit: "cover", borderRadius: "50%" }}
                      />
                    ) : (
                      <div style={styles.avatarFallback}>👤</div>
                    )}
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div
                      style={{
                        ...styles.nameText,
                        color: theme === "dark" ? "#ededed" : "#0f2230",
                      }}
                    >
                      {fullName}
                    </div>
                    <div
                      style={{
                        ...styles.muted,
                        color: theme === "dark" ? "#a0a0a0" : "#475569",
                      }}
                    >
                      {userData?.email || user?.email || "—"}
                    </div>
                    <div
                      style={{
                        ...styles.muted,
                        color: theme === "dark" ? "#a0a0a0" : "#475569",
                      }}
                    >
                      {userData?.phone || user?.phone || "—"}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section
              style={{
                ...styles.cardWide,
                background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
              }}
            >
              {error && <div style={styles.errorBox}>{error}</div>}

              {filteredTrips.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🚗</div>
                  <div style={styles.emptyText}>
                    {activeTab === "conductor"
                      ? "No has publicado ningún viaje aún."
                      : "No te has aplicado a ningún viaje aún."}
                  </div>
                  {activeTab === "conductor" && (
                    <button
                      style={styles.createButton}
                      onClick={() => router.push("/pages/login/landing")}
                    >
                      Crear un viaje
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.tripsList}>
                  {filteredTrips.map((trip) => (
                    <div key={trip.trip_id} style={styles.tripCard}>
                      <div style={styles.tripHeader}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              background:
                                trip.status === "open"
                                  ? "rgba(40,167,69,0.15)"
                                  : "rgba(108,117,125,0.15)",
                              color:
                                trip.status === "open" ? "#28a745" : "#6c757d",
                            }}
                          >
                            {trip.status === "open" ? "Abierto" : trip.status || "Desconocido"}
                          </span>
                          {activeTab === "pasajero" && (
                            <span
                              style={{
                                ...styles.statusBadge,
                                background: "rgba(59,130,246,0.15)",
                                color: "#3b82f6",
                              }}
                            >
                              En waitlist
                            </span>
                          )}
                        </div>
                        <div style={styles.tripFare}>
                          ${Number(trip.fare || 0).toLocaleString("es-CO")}
                        </div>
                      </div>

                      <div style={styles.tripBody}>
                        <div style={styles.locationRow}>
                          <div style={styles.locationItem}>
                            <div style={styles.locationLabel}>Origen</div>
                            <div style={styles.locationValue}>
                              {trip.start?.address || "—"}
                            </div>
                          </div>
                          <div style={styles.locationItem}>
                            <div style={styles.locationLabel}>Destino</div>
                            <div style={styles.locationValue}>
                              {trip.destination?.address || "—"}
                            </div>
                          </div>
                        </div>

                        <div style={styles.tripMeta}>
                          <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Fecha y hora:</span>
                            <span style={styles.metaValue}>
                              {trip.time ? formatDateTime(trip.time) : "—"}
                            </span>
                          </div>
                          <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Asientos disponibles:</span>
                            <span style={styles.metaValue}>{trip.seats || 0}</span>
                          </div>
                          {trip.vehicle && (
                            <div style={styles.metaItem}>
                              <span style={styles.metaLabel}>Vehículo:</span>
                              <span style={styles.metaValue}>
                                {trip.vehicle.model || "—"} • {trip.vehicle.license_plate || "—"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    fontFamily: "Inter, Nunito Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    width: "min(1200px, 100%)",
    background: "#ffffff",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
    display: "grid",
    gap: 24,
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
    cursor: "default",
  },
  backButton: {
    background: "transparent",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: "8px 16px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    color: "#111827",
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
    background: "#1e2937",
    display: "grid",
    placeItems: "center",
  },
  content: {
    display: "grid",
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0f2230",
    margin: 0,
  },
  errorBox: {
    background: "rgba(220,38,38,0.08)",
    color: "#b91c1c",
    padding: "12px 16px",
    borderRadius: 12,
    fontSize: 14,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    textAlign: "center",
    gap: 16,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyText: {
    fontSize: 18,
    color: "#475569",
    marginBottom: 8,
  },
  createButton: {
    background: "#0f2230",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 24px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  tripsList: {
    display: "grid",
    gap: 16,
  },
  tripCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid rgba(15,34,48,0.1)",
    padding: "20px 24px",
    display: "grid",
    gap: 16,
  },
  tripHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  tripStatus: {
    display: "flex",
    alignItems: "center",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  tripFare: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f2230",
  },
  tripBody: {
    display: "grid",
    gap: 16,
  },
  locationRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16,
  },
  locationItem: {
    display: "grid",
    gap: 4,
  },
  locationLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    color: "#475569",
    letterSpacing: 0.5,
    fontWeight: 600,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: 600,
    color: "#0f2230",
  },
  tripMeta: {
    display: "grid",
    gap: 8,
    paddingTop: 12,
    borderTop: "1px solid rgba(15,34,48,0.08)",
  },
  metaItem: {
    display: "flex",
    gap: 8,
    fontSize: 13,
  },
  metaLabel: {
    color: "#64748b",
    fontWeight: 500,
  },
  metaValue: {
    color: "#0f2230",
    fontWeight: 600,
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    background: "#0f2230",
    color: "#fff",
  },
  loadingCard: {
    background: "rgba(15,34,48,0.25)",
    padding: "18px 28px",
    borderRadius: 14,
    fontSize: 16,
  },
  userHeader: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 16,
    marginTop: 8,
    width: "100%",
  },
  userHeaderButton: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    cursor: "pointer",
    padding: "10px 18px",
    borderRadius: 12,
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  userHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    position: "relative",
    overflow: "hidden",
    background: "#e2e8f0",
  },
  userHeaderAvatarFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  userHeaderName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f2230",
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
  cardWide: {
    background: "#e5e7eb",
    borderRadius: 10,
    padding: 24,
    display: "grid",
    gap: 20,
    gridTemplateColumns: "1fr",
    alignItems: "start",
  },
  headerRow: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  avatarWrap: {
    position: "relative",
    width: 90,
    height: 90,
    borderRadius: "50%",
    overflow: "hidden",
    background: "#0f2230",
    display: "grid",
    placeItems: "center",
  },
  avatarFallback: {
    fontSize: 40,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 700,
  },
  muted: {
    fontSize: 14,
  },
  body: {
    display: "grid",
    gap: 24,
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
  tabsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  tabsWrapper: {
    position: "relative",
    display: "flex",
    background: "#f1f5f9",
    borderRadius: 8,
    padding: 4,
    gap: 0,
  },
  tabButton: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    background: "transparent",
    border: "none",
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 500,
    color: "#64748b",
    cursor: "pointer",
    borderRadius: 6,
    transition: "color 0.2s ease",
  },
  tabButtonActive: {
    fontWeight: 600,
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: "calc(50% - 4px)",
    height: "calc(100% - 8px)",
    background: "#ffffff",
    borderRadius: 6,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 0,
  },
};

