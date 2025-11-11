"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import Image from "next/image";

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
  vehicle?: {
    model?: string;
    license_plate?: string;
  };
  createdAt?: string;
}

export default function MyTripsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await ensureValidToken();
        if (!token) {
          router.push("/pages/login");
          return;
        }

        // Obtener datos del usuario
        const userResponse = await api.get("/api/me", token);
        if (userResponse) {
          setUserData(userResponse);
        }

        // Obtener viajes
        const response = await api.get("/api/trips", token);
        if (response && Array.isArray(response.trips)) {
          setTrips(response.trips);
        } else {
          setTrips([]);
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

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingCard}>Cargando viajes…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div 
            style={styles.brandButton}
            onClick={() => router.push("/pages/login/landing")}
          >
            <span style={styles.brand}>MoveTogether</span>
            <span style={styles.tripTag}>My Trips</span>
          </div>
          <button
            style={styles.backButton}
            onClick={() => {
              router.push("/pages/login/landing");
            }}
          >
            ← Volver
          </button>
        </header>

        {/* Header con foto y nombre - Click para ir al perfil */}
        {userData && (
          <div style={styles.userHeader}>
            <button
              type="button"
              style={styles.userHeaderButton}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Click en botón de perfil");
                // Guardar origen en sessionStorage antes de ir al perfil
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("profile_return_path", "/pages/trips");
                }
                router.push("/pages/user");
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
            >
              <div style={styles.userHeaderAvatar}>
                {userData.user_photo ? (
                  <Image
                    src={userData.user_photo}
                    alt="User avatar"
                    fill
                    style={{ objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  <div style={styles.userHeaderAvatarFallback}>👤</div>
                )}
              </div>
              <span style={styles.userHeaderName}>
                {userData.first_name || ""} {userData.last_name || ""}
              </span>
            </button>
          </div>
        )}

        <section style={styles.content}>
          <h1 style={styles.title}>Mis Viajes</h1>

          {error && <div style={styles.errorBox}>{error}</div>}

          {trips.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🚗</div>
              <div style={styles.emptyText}>
                No has publicado ningún viaje aún.
              </div>
              <button
                style={styles.createButton}
                onClick={() => router.push("/pages/login/landing")}
              >
                Crear un viaje
              </button>
            </div>
          ) : (
            <div style={styles.tripsList}>
              {trips.map((trip) => (
                <div key={trip.trip_id} style={styles.tripCard}>
                  <div style={styles.tripHeader}>
                    <div style={styles.tripStatus}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background:
                            trip.status === "open"
                              ? "rgba(40,167,69,0.15)"
                              : "rgba(108,117,125,0.15)",
                          color:
                            trip.status === "open"
                              ? "#28a745"
                              : "#6c757d",
                        }}
                      >
                        {trip.status === "open" ? "Abierto" : trip.status || "Desconocido"}
                      </span>
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
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    padding: "40px 24px",
    display: "flex",
    justifyContent: "center",
    fontFamily: "Inter, Nunito Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    width: "min(1200px, 100%)",
    background: "#ffffff",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "grid",
    gap: 24,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brandButton: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f2230",
    letterSpacing: 0.5,
  },
  tripTag: {
    background: "rgba(15, 34, 48, 0.08)",
    color: "#0f2230",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
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
};

