"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import Image from "next/image";
import { useTheme } from "@/app/contexts/ThemeContext";

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
  waitlist?: any[];
  passenger_list?: any[];
  vehicle?: {
    model?: string;
    license_plate?: string;
  };
  createdAt?: string;
}

interface MyTripsProps {
  user?: any;
  userData?: any;
  onRefreshUser?: () => void;
}

export default function MyTrips({ user, userData: initialUserData, onRefreshUser }: MyTripsProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
  const [passengerTrips, setPassengerTrips] = useState<Trip[]>([]);
  const [myTripsStatus, setMyTripsStatus] = useState<Record<string, string>>({});
  const [passengerTripEntries, setPassengerTripEntries] = useState<Array<{ trip: Trip; entryStatus: string; entryIndex: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(initialUserData || null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState<"conductor" | "pasajero">("conductor");
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

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

  const loadTrips = useCallback(async () => {
    try {
      const token = await ensureValidToken();
      if (!token) {
        router.push("/pages/login");
        return;
      }

      // Obtener datos del usuario
      const meResponse = await api.get("/api/me", token);
      console.log("👤 MyTrips /api/me response:", meResponse);
      console.log("👤 MyTrips my_trips from /api/me:", meResponse?.my_trips);
      console.log("👤 MyTrips my_trips length:", meResponse?.my_trips?.length);
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
        // Extraer IDs únicos de my_trips para obtener los datos del viaje
        const myTripIds: string[] = [];
        const myTripsEntries: Array<{ trip_id: string; status: string; entryIndex: number }> = [];
        
        meResponse.my_trips.forEach((item: any, index: number) => {
          if (typeof item === "string") {
            myTripIds.push(item);
            myTripsEntries.push({ trip_id: item, status: "waitlist", entryIndex: index });
          } else if (item && typeof item === "object" && item.trip_id) {
            const currentStatus = item.status || "waitlist";
            myTripIds.push(item.trip_id);
            myTripsEntries.push({ trip_id: item.trip_id, status: currentStatus, entryIndex: index });
            console.log(`📋 Entry ${index}: trip_id ${item.trip_id} with status ${currentStatus}`);
          }
        });
        
        console.log(`📋 Total entries in my_trips: ${myTripsEntries.length}`);
        console.log(`📋 Total trip IDs collected (before deduplication): ${myTripIds.length}`);
        
        // Obtener IDs únicos para hacer la query
        const uniqueTripIds = Array.from(new Set(myTripIds));
        console.log("📊 MyTrips unique trip IDs (after deduplication):", uniqueTripIds);
        
        if (uniqueTripIds.length > 0) {
          const query = encodeURIComponent(uniqueTripIds.join(","));
          console.log(`🚌 Fetching trips with IDs: ${uniqueTripIds.join(", ")}`);
          const passengerResp = await api.get(`/api/trips?ids=${query}`, token);
          console.log("🚌 MyTrips passenger trips resp:", passengerResp);
          
          if (passengerResp && Array.isArray(passengerResp.trips)) {
            // Crear un mapa de viajes por trip_id para acceso rápido
            const tripsMap = new Map<string, Trip>();
            passengerResp.trips.forEach((trip: any) => {
              tripsMap.set(trip.trip_id, trip);
            });
            
            // Crear una entrada por cada entrada en my_trips, combinada con su viaje
            const entries: Array<{ trip: Trip; entryStatus: string; entryIndex: number }> = [];
            myTripsEntries.forEach((entry) => {
              const trip = tripsMap.get(entry.trip_id);
              if (trip) {
                entries.push({
                  trip,
                  entryStatus: entry.status,
                  entryIndex: entry.entryIndex,
                });
                console.log(`✅ Created entry for trip ${entry.trip_id} with status ${entry.status}`);
              } else {
                console.warn(`⚠️ Trip ${entry.trip_id} not found in backend response`);
              }
            });
            
            console.log(`🚌 Created ${entries.length} trip entries (one per cupo)`);
            setPassengerTripEntries(entries);
            
            // También mantener passengerTrips para compatibilidad (usando viajes únicos)
            const uniqueTrips = Array.from(tripsMap.values());
            setPassengerTrips(uniqueTrips);
            
            // Crear statusMap para compatibilidad (usando el estado de la primera entrada de cada trip_id)
            const statusMap: Record<string, string> = {};
            myTripsEntries.forEach((entry) => {
              if (!statusMap[entry.trip_id]) {
                statusMap[entry.trip_id] = entry.status;
              }
            });
            setMyTripsStatus(statusMap);
          } else {
            setPassengerTripEntries([]);
            setPassengerTrips([]);
            setMyTripsStatus({});
          }
        } else {
          setPassengerTripEntries([]);
          setPassengerTrips([]);
          setMyTripsStatus({});
        }
      } else {
        setPassengerTripEntries([]);
        setPassengerTrips([]);
        setMyTripsStatus({});
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err?.message || "No se pudieron cargar los viajes");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

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
      console.log("🚗 Filtered trips (conductor):", driverTrips.length, "trips");
      return driverTrips;
    }
    // En modo pasajero, usar passengerTripEntries para mostrar una tarjeta por cada cupo
    console.log("🚌 Filtered trips (pasajero):", passengerTripEntries.length, "entries (one per cupo)");
    console.log("🚌 Passenger trip entries details:", passengerTripEntries.map((entry: any, idx: number) => ({ 
      index: idx,
      trip_id: entry.trip?.trip_id, 
      entryStatus: entry.entryStatus,
      entryIndex: entry.entryIndex,
      uniqueKey: `${entry.trip?.trip_id}-${entry.entryIndex}`
    })));
    // Retornar las entradas directamente para el renderizado
    return passengerTripEntries;
  }, [activeTab, driverTrips, passengerTripEntries]);

  const handleAcceptPassenger = useCallback(
    async (tripId: string, passengerUserId: string) => {
      try {
        const token = await ensureValidToken();
        if (!token) {
          alert("No estás autenticado. Inicia sesión nuevamente.");
          return;
        }

        await api.patch(
          "/api/trips",
          {
            trip_id: tripId,
            user_id: passengerUserId,
            action: "accept",
          },
          token
        );
        alert("Pasajero aceptado exitosamente.");
        // Esperar un momento para que el backend complete la actualización
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadTrips(); // Refrescar la lista de viajes
        if (onRefreshUser) {
          onRefreshUser();
        }
      } catch (err: any) {
        console.error("Error al aceptar pasajero:", err);
        alert(err?.message || "No se pudo aceptar al pasajero.");
      }
    },
    [loadTrips, onRefreshUser]
  );

  const handleCancelTrip = useCallback(
    async (tripId: string) => {
      if (!confirm("¿Estás seguro de que quieres cancelar este viaje? Esta acción no se puede deshacer.")) {
        return;
      }

      try {
        const token = await ensureValidToken();
        if (!token) {
          alert("No estás autenticado. Inicia sesión nuevamente.");
          return;
        }

        await api.patch(
          "/api/trips",
          {
            trip_id: tripId,
            action: "cancel",
          },
          token
        );
        alert("Viaje cancelado exitosamente.");
        await loadTrips(); // Refrescar la lista de viajes
        if (onRefreshUser) {
          onRefreshUser();
        }
      } catch (err: any) {
        console.error("Error al cancelar viaje:", err);
        alert(err?.message || "No se pudo cancelar el viaje.");
      }
    },
    [loadTrips, onRefreshUser]
  );

  const handleCancelPassengerParticipation = useCallback(
    async (tripId: string) => {
      if (!confirm("¿Estás seguro de que quieres cancelar tu participación en este viaje? Esta acción no se puede deshacer.")) {
        return;
      }

      try {
        const token = await ensureValidToken();
        if (!token) {
          alert("No estás autenticado. Inicia sesión nuevamente.");
          return;
        }

        if (!userData?.user_id) {
          alert("No se pudo obtener tu información de usuario. Por favor, inicia sesión nuevamente.");
          return;
        }

        await api.patch(
          "/api/trips",
          {
            trip_id: tripId,
            user_id: userData.user_id,
            action: "cancel_passenger",
          },
          token
        );
        alert("Has cancelado tu participación en el viaje exitosamente.");
        await loadTrips(); // Refrescar la lista de viajes
        if (onRefreshUser) {
          onRefreshUser();
        }
      } catch (err: any) {
        console.error("Error al cancelar participación:", err);
        alert(err?.message || "No se pudo cancelar tu participación en el viaje.");
      }
    },
    [loadTrips, userData, onRefreshUser]
  );

  const handleRemovePassenger = useCallback(
    async (tripId: string, passengerUserId: string) => {
      if (!confirm(`¿Estás seguro de que quieres remover a este pasajero (${passengerUserId}) del viaje? Esta acción no se puede deshacer.`)) {
        return;
      }

      try {
        const token = await ensureValidToken();
        if (!token) {
          alert("No estás autenticado. Inicia sesión nuevamente.");
          return;
        }

        await api.patch(
          "/api/trips",
          {
            trip_id: tripId,
            user_id: passengerUserId,
            action: "remove_passenger",
          },
          token
        );
        alert("Pasajero removido exitosamente.");
        await loadTrips(); // Refrescar la lista de viajes
        if (onRefreshUser) {
          onRefreshUser();
        }
      } catch (err: any) {
        console.error("Error al remover pasajero:", err);
        alert(err?.message || "No se pudo remover al pasajero.");
      }
    },
    [loadTrips, onRefreshUser]
  );

  const handleStartTrip = useCallback(
    async (tripId: string) => {
      try {
        const token = await ensureValidToken();
        if (!token) {
          router.push("/pages/login");
          return;
        }

        const resp = await api.patch(
          "/api/trips",
          {
            action: "start_trip",
            trip_id: tripId,
          },
          token
        );

        console.log("✅ Trip started:", resp);
        await loadTrips();
        if (onRefreshUser) {
          onRefreshUser();
        }
      } catch (e: any) {
        console.error("❌ Error starting trip:", e);
        alert(e?.message || "No se pudo iniciar el viaje");
      }
    },
    [router, loadTrips, onRefreshUser]
  );

  const handleFinishTrip = useCallback(
    async (tripId: string) => {
      try {
        const token = await ensureValidToken();
        if (!token) {
          router.push("/pages/login");
          return;
        }

        const resp = await api.patch(
          "/api/trips",
          {
            action: "finish_trip",
            trip_id: tripId,
          },
          token
        );

        console.log("✅ Trip finished:", resp);
        await loadTrips();
        if (onRefreshUser) {
          onRefreshUser();
        }
      } catch (e: any) {
        console.error("❌ Error finishing trip:", e);
        alert(e?.message || "No se pudo finalizar el viaje");
      }
    },
    [router, loadTrips, onRefreshUser]
  );

  const humanReadableStatus = useCallback((status: string) => {
    switch (status) {
      case "waitlist":
        return "En lista de espera";
      case "accepted":
        return "Viaje confirmado";
      case "in_progress":
        return "Viaje iniciado";
      case "finished":
        return "Viaje finalizado";
      case "cancelled":
        return "Viaje cancelado";
      case "open":
        return "Abierto";
      case "closed":
        return "Cerrado";
      default:
        return status;
    }
  }, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingCard}>Cargando viajes…</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
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
            {filteredTrips.map((item: any, index: number) => {
              // En modo pasajero, item es { trip, entryStatus, entryIndex }
              // En modo conductor, item es Trip
              const trip = activeTab === "pasajero" ? item.trip : item;
              const entryStatus = activeTab === "pasajero" ? item.entryStatus : null;
              const entryIndex = activeTab === "pasajero" ? item.entryIndex : index;
              
              // Usar entryStatus para pasajero, trip.status para conductor
              const tripStatus = activeTab === "pasajero" ? entryStatus : trip.status;
              const displayStatus = activeTab === "pasajero" 
                ? (trip.status === "cancelled" 
                    ? "Cancelado" 
                    : entryStatus === "in_progress"
                    ? "Viaje iniciado"
                    : entryStatus === "finished"
                    ? "Viaje finalizado"
                    : entryStatus === "accepted" 
                    ? "Viaje confirmado" 
                    : entryStatus === "cancelled" 
                    ? "Cancelado" 
                    : "En lista de espera")
                : (trip.status === "open" 
                    ? "Abierto" 
                    : trip.status === "in_progress"
                    ? "En progreso"
                    : trip.status === "finished"
                    ? "Finalizado"
                    : trip.status === "cancelled" 
                    ? "Cancelado" 
                    : trip.status === "closed" 
                    ? "Cerrado" 
                    : trip.status || "Desconocido");
              
              // Crear una key única: para pasajero usar trip_id + entryIndex, para conductor solo trip_id
              const uniqueKey = activeTab === "pasajero" 
                ? `${trip.trip_id}-${entryIndex}` 
                : trip.trip_id;
              
              console.log(`🎫 Rendering trip ${trip.trip_id} (entry ${entryIndex}):`, {
                activeTab,
                tripStatus,
                entryStatus,
                tripStatusFromTrip: trip.status,
                displayStatus,
                uniqueKey
              });
              return (
                <div key={uniqueKey} style={styles.tripCard}>
                  <div style={styles.tripHeader}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background:
                            activeTab === "conductor"
                              ? trip.status === "open"
                            ? "rgba(40,167,69,0.15)"
                                : trip.status === "in_progress"
                                ? "rgba(59,130,246,0.15)"
                                : trip.status === "finished"
                                ? "rgba(220,53,69,0.15)"
                                : trip.status === "cancelled"
                                ? "rgba(220,53,69,0.15)"
                                : trip.status === "closed"
                                ? "rgba(108,117,125,0.15)"
                                : "rgba(108,117,125,0.15)"
                              : trip.status === "cancelled"
                                ? "rgba(220,53,69,0.15)"
                                : entryStatus === "in_progress"
                                ? "rgba(59,130,246,0.15)"
                                : entryStatus === "finished"
                                ? "rgba(220,53,69,0.15)"
                                : entryStatus === "accepted"
                                ? "rgba(40,167,69,0.15)"
                                : entryStatus === "cancelled"
                                ? "rgba(220,53,69,0.15)"
                                : "rgba(255,193,7,0.15)",
                        color:
                            activeTab === "conductor"
                              ? trip.status === "open"
                                ? "#28a745"
                                : trip.status === "in_progress"
                                ? "#3b82f6"
                                : trip.status === "finished"
                                ? "#dc3545"
                                : trip.status === "cancelled"
                                ? "#dc3545"
                                : trip.status === "closed"
                                ? "#6c757d"
                                : "#6c757d"
                              : trip.status === "cancelled"
                                ? "#dc3545"
                                : entryStatus === "in_progress"
                                ? "#3b82f6"
                                : entryStatus === "finished"
                                ? "#dc3545"
                                : entryStatus === "accepted"
                                ? "#28a745"
                                : entryStatus === "cancelled"
                                ? "#dc3545"
                                : "#ffc107",
                      }}
                    >
                      {displayStatus}
                    </span>
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

                  {activeTab === "conductor" && (
                    <div style={styles.tripActions}>
                      {(() => {
                        const status = trip.status || "open"; // Si viene undefined, lo tratamos como open
                        const isOpen = status === "open";
                        const isClosed = status === "closed";
                        const isInProgress = status === "in_progress";
                        const isFinished = status === "finished";
                        const hasPassengers = Array.isArray(trip.passenger_list) && trip.passenger_list.length > 0;
                        
                        console.log(`[MyTrips] Trip ${trip.trip_id} status:`, status, { 
                          isOpen, 
                          isClosed, 
                          isInProgress, 
                          isFinished,
                          hasPassengers,
                          passengerCount: trip.passenger_list?.length || 0
                        });
                        
                        return (
                          <>
                            {(isOpen || (isClosed && hasPassengers)) && (
                              <button
                                type="button"
                                onClick={() => handleStartTrip(trip.trip_id)}
                                style={styles.startButton}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#2563eb";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#3b82f6";
                                }}
                              >
                                Iniciar viaje
                              </button>
                            )}
                            {isInProgress && (
                              <button
                                type="button"
                                onClick={() => handleFinishTrip(trip.trip_id)}
                                style={styles.finishButton}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#c82333";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#dc3545";
                                }}
                              >
                                Finalizar viaje
                              </button>
                            )}
                            {isFinished && (
                              <span style={styles.finishedBadge}>Viaje finalizado</span>
                            )}
                          </>
                        );
                      })()}
                      <button
                        type="button"
                        style={styles.detailsButton}
                        onClick={() => setExpandedTripId(expandedTripId === trip.trip_id ? null : trip.trip_id)}
                      >
                        {expandedTripId === trip.trip_id ? "Ocultar detalles" : "Ver detalles"}
                      </button>
                    </div>
                  )}

                  {activeTab === "pasajero" && entryStatus === "accepted" && trip.status !== "cancelled" && trip.status !== "finished" && (
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #dc3545",
                          background: "#dc3545",
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "background 0.2s ease, transform 0.1s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#c82333";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#dc3545";
                        }}
                        onClick={() => handleCancelPassengerParticipation(trip.trip_id)}
                      >
                        Cancelar participación
                      </button>
                    </div>
                  )}

                  {activeTab === "conductor" && expandedTripId === trip.trip_id && (
                    <div style={styles.detailsPanel}>
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>ID del viaje:</span>
                        <span style={styles.metaValue}>{trip.trip_id}</span>
                      </div>
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>Creado:</span>
                        <span style={styles.metaValue}>
                          {trip.createdAt ? formatDateTime(trip.createdAt) : "—"}
                        </span>
                      </div>
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>Estado:</span>
                        <span style={styles.metaValue}>
                          {trip.status === "open"
                            ? "Abierto"
                            : trip.status === "cancelled"
                            ? "Cancelado"
                            : trip.status === "closed"
                            ? "Cerrado"
                            : trip.status || "—"}
                        </span>
                      </div>

                      {trip.status === "open" && (
                        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            style={{
                              padding: "8px 16px",
                              borderRadius: 8,
                              border: "1px solid #dc3545",
                              background: "#dc3545",
                              color: "#ffffff",
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background 0.2s ease, transform 0.1s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#c82333";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#dc3545";
                            }}
                            onClick={() => handleCancelTrip(trip.trip_id)}
                          >
                            Cancelar viaje
                          </button>
                        </div>
                      )}

                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>En lista de espera:</span>
                        <div style={styles.waitlistContainer}>
                          {Array.isArray(trip.waitlist) && trip.waitlist.length > 0 ? (
                            trip.waitlist.map((entry: any, index: number) => (
                              <div key={index} style={styles.waitlistEntry}>
                                <div style={styles.waitlistMainLine}>
                                  <span style={styles.waitlistTime}>
                                    {entry.appliedAt
                                      ? new Date(entry.appliedAt).toLocaleTimeString("es-CO", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : `Pasajero ${index + 1}`}
                                  </span>
                                  <span style={styles.waitlistText}>
                                    {entry.origin?.address || "Origen desconocido"} →{" "}
                                    {entry.destination?.address || "Destino desconocido"}
                                  </span>
                                  <button
                                    type="button"
                                    style={styles.waitlistAcceptButton}
                                    onClick={() => handleAcceptPassenger(trip.trip_id, entry.user_id)}
                                  >
                                    Aceptar
                                  </button>
                                  <button
                                    type="button"
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: 6,
                                      border: "1px solid #dc3545",
                                      background: "#dc3545",
                                      color: "#ffffff",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                      transition: "background 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "#c82333";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#dc3545";
                                    }}
                                    onClick={() => handleRemovePassenger(trip.trip_id, entry.user_id)}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                                <div style={styles.waitlistSubLine}>
                                  Código: {entry.user_id || "N/A"}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={styles.metaValue}>Nadie todavía</span>
                          )}
                        </div>
                      </div>

                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>Pasajeros confirmados:</span>
                        <div style={styles.waitlistContainer}>
                          {Array.isArray(trip.passenger_list) && trip.passenger_list.length > 0 ? (
                            trip.passenger_list.map((entry: any, index: number) => (
                              <div key={index} style={styles.waitlistEntry}>
                                <div style={styles.waitlistMainLine}>
                                  <span style={{ ...styles.waitlistTime, color: "#28a745" }}>
                                    {entry.appliedAt
                                      ? new Date(entry.appliedAt).toLocaleTimeString("es-CO", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : `Pasajero ${index + 1}`}
                                  </span>
                                  <span style={styles.waitlistText}>
                                    {entry.origin?.address || "Origen desconocido"} →{" "}
                                    {entry.destination?.address || "Destino desconocido"}
                                  </span>
                                  {trip.status !== "finished" && (
                                    <button
                                      type="button"
                                      style={{
                                        marginLeft: "auto",
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        border: "1px solid #dc3545",
                                        background: "#dc3545",
                                        color: "#ffffff",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        transition: "background 0.2s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#c82333";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "#dc3545";
                                      }}
                                      onClick={() => handleRemovePassenger(trip.trip_id, entry.user_id)}
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                                <div style={styles.waitlistSubLine}>
                                  Código: {entry.user_id || "N/A"}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={styles.metaValue}>Nadie todavía</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "grid",
    gap: 20,
  },
  sectionTitle: {
    margin: "6px 0 10px 2px",
    fontSize: 22,
    fontWeight: 800,
    color: "#0f2230",
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsWrapper: {
    position: "relative",
    display: "flex",
    background: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    gap: 0,
  },
  tabButton: {
    flex: 1,
    padding: "10px 20px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    transition: "color 0.2s ease",
    position: "relative",
    zIndex: 1,
  },
  tabButtonActive: {
    fontWeight: 700,
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: "calc(50% - 4px)",
    height: "calc(100% - 8px)",
    borderRadius: 8,
    background: "#ffffff",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 0,
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
    minHeight: "200px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    background: "transparent",
    color: "#0f2230",
  },
  loadingCard: {
    background: "rgba(15,34,48,0.25)",
    padding: "18px 28px",
    borderRadius: 14,
    fontSize: 16,
  },
  tripActions: {
    padding: "12px 0",
    borderTop: "1px solid rgba(0, 0, 0, 0.1)",
    marginTop: 12,
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  startButton: {
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "background 0.2s ease",
  },
  finishButton: {
    background: "#dc3545",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "background 0.2s ease",
  },
  finishedBadge: {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#dc3545",
    background: "rgba(220,53,69,0.15)",
  },
  detailsButton: {
    background: "transparent",
    border: "1px solid rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "inherit",
    marginLeft: "auto",
  },
  detailsPanel: {
    marginTop: 16,
    padding: "16px",
    background: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    display: "grid",
    gap: 12,
  },
  waitlistContainer: {
    display: "grid",
    gap: 8,
    marginTop: 8,
  },
  waitlistEntry: {
    padding: "12px",
    background: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    display: "grid",
    gap: 6,
  },
  waitlistMainLine: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  waitlistTime: {
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    minWidth: 60,
  },
  waitlistText: {
    flex: 1,
    fontSize: 14,
    color: "inherit",
  },
  waitlistSubLine: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 72,
  },
  waitlistAcceptButton: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "background 0.2s",
  },
};

