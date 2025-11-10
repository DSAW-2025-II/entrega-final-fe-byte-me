"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

interface Coordinates {
  lat: number;
  lng: number;
}

interface TripDraft {
  from: string;
  to: string;
  fromCoord: Coordinates | null;
  toCoord: Coordinates | null;
  date: string;
  time: string;
}

interface Vehicle {
  vehicle_id: string;
  license_plate: string;
  model: string;
  capacity: number;
  SOAT?: string;
  photo?: string | null;
}

interface UserData {
  uid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_photo?: string | null;
}

const DEFAULT_CAR_IMAGE =
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop";

const TRIP_DRAFT_STORAGE_KEY = "movetogether_tripDraft";

export default function TripCreatePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [draftLoading, setDraftLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [fare, setFare] = useState("");
  const [seats, setSeats] = useState("");
  const [extraMinutes, setExtraMinutes] = useState("");
  const [posting, setPosting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tripFrom, setTripFrom] = useState("");
  const [tripTo, setTripTo] = useState("");
  const [tripFromCoord, setTripFromCoord] = useState<Coordinates | null>(null);
  const [tripToCoord, setTripToCoord] = useState<Coordinates | null>(null);
  const [tripDate, setTripDate] = useState("");
  const [tripTime, setTripTime] = useState("");
  const [tripInitialized, setTripInitialized] = useState(false);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [availableTripsLoading, setAvailableTripsLoading] = useState(false);
  const [availableTripsError, setAvailableTripsError] = useState<string | null>(null);
  const [roleMode, setRoleMode] = useState<"driver" | "passenger">("driver");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isPassenger = roleMode === "passenger";
  const canPublishTrip = !isPassenger && !posting;

  // Cargar borrador de viaje almacenado en sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = sessionStorage.getItem(TRIP_DRAFT_STORAGE_KEY);
      if (!stored) {
        router.replace("/pages/login/landing");
        return;
      }

      const parsed = JSON.parse(stored) as TripDraft;
      if (!parsed || !parsed.from || !parsed.to) {
        sessionStorage.removeItem(TRIP_DRAFT_STORAGE_KEY);
        router.replace("/pages/login/landing");
        return;
      }

      setDraft(parsed);
      setTripFrom(parsed.from);
      setTripTo(parsed.to);
      setTripFromCoord(parsed.fromCoord || null);
      setTripToCoord(parsed.toCoord || null);
      setTripDate(parsed.date || "");
      setTripTime(parsed.time || "");
      setTripInitialized(true);
    } catch (parseError) {
      console.error("Error parsing trip draft:", parseError);
      sessionStorage.removeItem(TRIP_DRAFT_STORAGE_KEY);
      router.replace("/pages/login/landing");
    } finally {
      setDraftLoading(false);
    }
  }, [router]);

  // Cargar datos del usuario y vehículos
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await ensureValidToken();
        if (!token) {
          router.replace("/pages/login");
          return;
        }

        try {
          const me = await api.get("/api/me", token);
          if (me) {
            setUserData({
              uid: me.uid,
              first_name: me.first_name,
              last_name: me.last_name,
              email: me.email,
              user_photo: me.user_photo,
            });
          }
        } catch (userError) {
          console.error("Error fetching user data:", userError);
          setError("No se pudo cargar la información del usuario");
        } finally {
          setUserLoading(false);
        }

        try {
          const response = await api.get("/api/vehicles", token);
          if (response && Array.isArray(response.vehicles)) {
            setVehicles(response.vehicles);
          }
        } catch (vehicleError) {
          console.error("Error fetching vehicles:", vehicleError);
          setError("No se pudieron cargar los vehículos registrados");
        } finally {
          setVehiclesLoading(false);
        }
      } catch (tokenError) {
        console.error("Token validation error:", tokenError);
        router.replace("/pages/login");
      }
    };

    loadData();
  }, [router]);

  const fetchAvailableTrips = useCallback(async () => {
    if (!tripInitialized || !tripFromCoord || !tripToCoord || !tripDate) {
      setAvailableTrips([]);
      setAvailableTripsError(null);
      return;
    }

    try {
      setAvailableTripsLoading(true);
      setAvailableTripsError(null);
      const token = await ensureValidToken();
      if (!token) {
        router.replace("/pages/login");
        return;
      }

      const params = new URLSearchParams({
        search: "true",
        fromLat: String(tripFromCoord.lat),
        fromLng: String(tripFromCoord.lng),
        toLat: String(tripToCoord.lat),
        toLng: String(tripToCoord.lng),
        date: tripDate,
      });

      if (tripTime) {
        params.set("time", tripTime);
      }

      params.set("viewerRole", roleMode);

      const response = await api.get(`/api/trips?${params.toString()}`, token);
      if (response && Array.isArray(response.trips)) {
        setAvailableTrips(response.trips);
      } else {
        setAvailableTrips([]);
      }
    } catch (searchError: any) {
      console.error("Error searching trips:", searchError);
      setAvailableTripsError(searchError?.message || "No se pudieron cargar los viajes disponibles");
    } finally {
      setAvailableTripsLoading(false);
    }
  }, [tripInitialized, tripFromCoord, tripToCoord, tripDate, tripTime, router, roleMode]);

  useEffect(() => {
    fetchAvailableTrips();
  }, [fetchAvailableTrips]);

  const userName = useMemo(() => {
    if (!userData) return "Usuario";
    const first = (userData.first_name || "").trim();
    const last = (userData.last_name || "").trim();
    if (first || last) {
      return `${first} ${last}`.trim();
    }
    if (userData.email) {
      return userData.email.split("@")[0];
    }
    return "Usuario";
  }, [userData]);

  const formattedDate = useMemo(() => {
    if (!tripDate) return "—";
    try {
      const dateObj = new Date(`${tripDate}T00:00:00`);
      return dateObj.toLocaleDateString("es-CO", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
    } catch {
      return tripDate;
    }
  }, [tripDate]);

  const formattedTime = useMemo(() => {
    if (!tripTime) return "—";
    try {
      const [hours, minutes] = tripTime.split(":");
      const dateObj = new Date();
      dateObj.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);
      return dateObj.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return tripTime;
    }
  }, [tripTime]);

  const formatTripDateTime = (iso: string) => {
    try {
      const dateObj = new Date(iso);
      const dateString = dateObj.toLocaleDateString("es-CO", {
        weekday: "short",
        day: "2-digit",
        month: "short",
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

  const handleOpenVehicleModal = () => {
    if (!canPublishTrip) {
      if (isPassenger) {
        setError("Cambia a modo conductor para publicar un viaje");
      }
      return;
    }

    setFeedback(null);
    setError(null);
    setSelectedVehicle(null);
    setFare("");
    setSeats("");
    setExtraMinutes("");
    setShowVehicleModal(true);
  };

  const handleCloseModal = () => {
    if (posting) return;
    setShowVehicleModal(false);
    setSelectedVehicle(null);
    setFare("");
    setSeats("");
    setExtraMinutes("");
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFare("");
    const defaultSeats = Math.max((vehicle.capacity || 1) - 1, 1);
    setSeats(String(defaultSeats));
  };

  const handleCreateTrip = async () => {
    if (!canPublishTrip) {
      return;
    }

    if (!tripInitialized || !userData || !selectedVehicle) {
      return;
    }

    const seatsNumber = Number(seats);
    const fareNumber = Number(fare);
    const extraMinutesNumber = extraMinutes ? Number(extraMinutes) : 0;

    if (!tripFrom || !tripTo) {
      setError("Debes indicar origen y destino");
      return;
    }

    if (!tripDate) {
      setError("Selecciona la fecha del viaje");
      return;
    }

    if (!tripTime) {
      setError("Selecciona la hora del viaje");
      return;
    }

    if (extraMinutes && (!Number.isFinite(extraMinutesNumber) || extraMinutesNumber < 0)) {
      setError("Ingresa minutos extra válidos (0 o más)");
      return;
    }

    if (!Number.isFinite(seatsNumber) || seatsNumber <= 0) {
      setError("Ingresa un número de asientos válido");
      return;
    }

    if (seatsNumber > selectedVehicle.capacity) {
      setError(`El vehículo solo tiene capacidad para ${selectedVehicle.capacity} pasajeros`);
      return;
    }

    if (!Number.isFinite(fareNumber) || fareNumber <= 0) {
      setError("Ingresa una tarifa válida");
      return;
    }

    try {
      setPosting(true);
      setError(null);

      const token = await ensureValidToken();
      if (!token) {
        router.replace("/pages/login");
        return;
      }

      const tripTimeIso = new Date(`${tripDate}T${tripTime || "00:00"}:00`).toISOString();

      const payload = {
        driver_id: userData.uid,
        driver: {
          uid: userData.uid,
          name: userName,
          email: userData.email || null,
          photo: userData.user_photo || null,
        },
        start: {
          address: tripFrom,
          coordinates: tripFromCoord,
        },
        destination: {
          address: tripTo,
          coordinates: tripToCoord,
        },
        time: tripTimeIso,
        seats: seatsNumber,
        fare: fareNumber,
        extra_minutes: extraMinutesNumber,
        vehicle: {
          vehicle_id: selectedVehicle.vehicle_id,
          license_plate: selectedVehicle.license_plate,
          model: selectedVehicle.model,
          capacity: selectedVehicle.capacity,
        },
      };

      const response = await api.post("/api/trips", payload, token);

      if (response && response.trip_id) {
        setFeedback("Viaje publicado correctamente");
        setShowVehicleModal(false);
        setSelectedVehicle(null);
        setFare("");
        setSeats("");
        setExtraMinutes("");
        await fetchAvailableTrips();
      } else {
        setError("No se pudo crear el viaje. Intenta nuevamente");
      }
    } catch (tripError: any) {
      console.error("Error posting trip:", tripError);
      setError(tripError?.message || "No se pudo crear el viaje");
    } finally {
      setPosting(false);
    }
  };

  if (draftLoading || userLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingCard}>Cargando información…</div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingCard}>
          No encontramos los datos del viaje. Vuelve a planificarlo.
        </div>
        <button style={styles.backBtn} onClick={() => router.replace("/pages/login/landing")}>
          Regresar al dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button
            type="button"
            style={styles.brandButton}
            onClick={() => router.push("/pages/login/landing")}
          >
            <span style={styles.brand}>MoveTogether</span>
            <span style={styles.tripTag}>Route</span>
          </button>
          <div style={styles.controlsRow}>
            <div style={styles.roleSwitch} role="group" aria-label="Modo de uso">
              <div
                style={{
                  ...styles.roleSwitchThumb,
                  transform: roleMode === "driver" ? "translateX(0)" : "translateX(100%)",
                }}
              />
              <button
                type="button"
                style={{
                  ...styles.roleSwitchButton,
                  color: roleMode === "driver" ? "#ffffff" : "#475569",
                }}
                onClick={() => setRoleMode("driver")}
              >
                Driver
              </button>
              <button
                type="button"
                style={{
                  ...styles.roleSwitchButton,
                  color: roleMode === "passenger" ? "#ffffff" : "#475569",
                }}
                onClick={() => setRoleMode("passenger")}
              >
                Passenger
              </button>
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userAvatarContainer}>
                {userData?.user_photo ? (
                  <Image
                    src={userData.user_photo}
                    alt="User avatar"
                    fill
                    style={{ objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  <div style={styles.userAvatarFallback}>👤</div>
                )}
              </div>
              <span style={styles.userName}>{userName}</span>
            </div>
          </div>
        </header>

        <section style={styles.tripCard}>
          <div style={styles.tripRow}>
            <div style={styles.locationCard}>
              <div style={styles.locationLabel}>From</div>
              <PlaceAutocomplete
                value={tripFrom}
                onChange={(value) => {
                  setTripFrom(value);
                  if (!value) {
                    setTripFromCoord(null);
                  }
                }}
                onSelect={(selection) => {
                  setTripFrom(selection.address);
                  setTripFromCoord({ lat: selection.lat, lng: selection.lng });
                }}
                placeholder="Selecciona el origen"
                disabled={posting}
              />
            </div>
            <div style={styles.switchWrapper}>
              <button
                type="button"
                style={styles.switchButton}
                onClick={() => {
                  setTripFrom(tripTo);
                  setTripFromCoord(tripToCoord);
                  setTripTo(tripFrom);
                  setTripToCoord(tripFromCoord);
                }}
                title="Intercambiar origen y destino"
              >
                ↻
              </button>
            </div>
            <div style={styles.locationCard}>
              <div style={styles.locationLabel}>To</div>
              <PlaceAutocomplete
                value={tripTo}
                onChange={(value) => {
                  setTripTo(value);
                  if (!value) {
                    setTripToCoord(null);
                  }
                }}
                onSelect={(selection) => {
                  setTripTo(selection.address);
                  setTripToCoord({ lat: selection.lat, lng: selection.lng });
                }}
                placeholder="Selecciona el destino"
                disabled={posting}
              />
            </div>
            <div style={styles.timeCard}>
              <div style={styles.dateTimeRow}>
                <div style={styles.dateTimeField}>
                  <label style={styles.inputLabel}>Departure day</label>
                  <div style={styles.inputWithIcon}>
                    <input
                      type="date"
                      value={tripDate}
                      onChange={(event) => setTripDate(event.target.value)}
                      min={today}
                      style={styles.dateInput}
                    />
                    <span role="img" aria-label="calendar">
                      📅
                    </span>
                  </div>
                </div>
                <div style={styles.dateTimeField}>
                  <label style={styles.inputLabel}>Hour</label>
                  <div style={styles.inputWithIcon}>
                    <input
                      type="time"
                      value={tripTime}
                      onChange={(event) => setTripTime(event.target.value)}
                      style={styles.dateInput}
                    />
                    <span role="img" aria-label="clock">
                      ⏱️
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              style={{
                ...styles.addTripBtn,
                ...(canPublishTrip ? {} : styles.addTripBtnDisabled),
              }}
              onClick={handleOpenVehicleModal}
              title={
                canPublishTrip
                  ? "Seleccionar vehículo"
                  : "Cambia a modo conductor para publicar"
              }
              disabled={!canPublishTrip}
            >
              <span style={styles.addTripBtnIcon}>+</span>
            </button>
          </div>

          <div style={styles.tripBody}>
            {feedback ? (
              <div style={styles.feedback}>{feedback}</div>
            ) : availableTripsLoading ? (
              <div style={styles.placeholder}>Buscando viajes compatibles…</div>
            ) : availableTripsError ? (
              <div style={styles.errorBox}>{availableTripsError}</div>
            ) : availableTrips.length > 0 ? (
              <div style={styles.availableList}>
                {availableTrips.map((trip: any) => (
                  <div key={trip.trip_id} style={styles.availableItem}>
                    <div style={styles.availableHeader}>
                      <div style={styles.availableDriver}>
                        <div style={styles.availableDriverPhoto}>
                          {trip.driver?.photo ? (
                            <img src={trip.driver.photo} alt={trip.driver.name || "Driver"} style={styles.availableDriverPhotoImg} />
                          ) : (
                            <span role="img" aria-label="Driver">👤</span>
                          )}
                        </div>
                        <div style={styles.availableDriverInfo}>
                          <div style={styles.availableDriverName}>{trip.driver?.name || "Conductor"}</div>
                          {trip.vehicle?.model && (
                            <div style={styles.availableDriverVehicle}>{trip.vehicle.model} · {trip.vehicle?.license_plate || "Sin placa"}</div>
                          )}
                        </div>
                      </div>
                      <div style={styles.availableFare}>${Number(trip.fare || 0).toLocaleString("es-CO")}</div>
                    </div>
                    <div style={styles.availableBody}>
                      <div>
                        <div style={styles.availableLabel}>Salida</div>
                        <div style={styles.availableValue}>{trip.start?.address || "—"}</div>
                      </div>
                      <div>
                        <div style={styles.availableLabel}>Destino</div>
                        <div style={styles.availableValue}>{trip.destination?.address || "—"}</div>
                      </div>
                      <div>
                        <div style={styles.availableLabel}>Horario</div>
                        <div style={styles.availableValue}>{formatTripDateTime(trip.time)}</div>
                      </div>
                    </div>
                    <div style={styles.availableMeta}>
                      <div>Asientos libres: {trip.seats}</div>
                      <div>Extra minutos: {trip.extra_minutes || 0}</div>
                    </div>
                    <button
                      style={{
                        ...styles.availableAction,
                        ...(isPassenger ? {} : styles.availableActionDisabled),
                      }}
                      onClick={() => alert("Funcionalidad para solicitar viaje próximamente")}
                      disabled={!isPassenger}
                    >
                      Aplicar al viaje
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.placeholder}>
                Ningún viaje coincide con tu ruta y tolerancia de desvío.
                <br />
                Intenta ajustar origen/destino o el horario para ver más opciones.
              </div>
            )}
          </div>
        </section>
      </div>

      {showVehicleModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalTitle}>Seleccionar vehículo</div>
                <div style={styles.modalSubtitle}>
                  {selectedVehicle
                    ? "Confirma la tarifa y los asientos disponibles"
                    : "Elige el vehículo con el que quieres ofrecer el viaje"}
                </div>
              </div>
              <button
                style={styles.modalCloseBtn}
                onClick={handleCloseModal}
                disabled={posting}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {vehiclesLoading ? (
              <div style={styles.modalLoading}>Cargando vehículos…</div>
            ) : vehicles.length === 0 ? (
              <div style={styles.modalEmpty}>
                No tienes vehículos registrados. Agrega uno en "My Car" para poder publicar viajes.
              </div>
            ) : selectedVehicle ? (
              <div style={styles.vehicleForm}>
                <div style={styles.vehiclePreview}>
                  <img
                    src={selectedVehicle.photo || DEFAULT_CAR_IMAGE}
                    alt={selectedVehicle.model}
                    style={styles.vehicleImage}
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE;
                    }}
                  />
                  <div style={styles.vehicleInfo}>
                    <div style={styles.vehicleName}>{selectedVehicle.model}</div>
                    <div style={styles.vehiclePlate}>{selectedVehicle.license_plate}</div>
                    <div style={styles.vehicleCapacity}>
                      Capacidad total: {selectedVehicle.capacity} pasajeros
                    </div>
                  </div>
                </div>

                <label style={styles.inputLabel}>Asientos disponibles</label>
                <input
                  type="number"
                  min={1}
                  max={selectedVehicle.capacity}
                  step={1}
                  value={seats}
                  onChange={(event) => setSeats(event.target.value)}
                  style={styles.input}
                  disabled={posting}
                />

                <label style={styles.inputLabel}>Tarifa por pasajero (COP)</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={fare}
                  onChange={(event) => setFare(event.target.value)}
                  style={styles.input}
                  disabled={posting}
                />

                <label style={styles.inputLabel}>Minutos extra para desvíos</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  placeholder="Ej: 10"
                  value={extraMinutes}
                  onChange={(event) => setExtraMinutes(event.target.value)}
                  style={styles.input}
                  disabled={posting}
                />

                <button
                  style={{ ...styles.confirmBtn, opacity: posting ? 0.7 : 1 }}
                  onClick={handleCreateTrip}
                  disabled={posting}
                >
                  {posting ? "Publicando viaje…" : "Publicar viaje"}
                </button>

                <button
                  style={styles.secondaryAction}
                  onClick={() => setSelectedVehicle(null)}
                  disabled={posting}
                >
                  Elegir otro vehículo
                </button>
              </div>
            ) : (
              <div style={styles.vehicleList}>
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.vehicle_id}
                    style={styles.vehicleCard}
                    onClick={() => handleSelectVehicle(vehicle)}
                  >
                    <div style={styles.vehicleCardThumb}>
                      <img
                        src={vehicle.photo || DEFAULT_CAR_IMAGE}
                        alt={vehicle.model}
                        style={styles.vehicleCardImage}
                        onError={(event) => {
                          (event.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE;
                        }}
                      />
                    </div>
                    <div style={styles.vehicleCardInfo}>
                      <div style={styles.vehicleCardName}>{vehicle.model}</div>
                      <div style={styles.vehicleCardPlate}>{vehicle.license_plate}</div>
                      <div style={styles.vehicleCardCapacity}>
                        Capacidad: {vehicle.capacity} pasajeros
                      </div>
                    </div>
                    <div style={styles.vehicleCardAction}>Seleccionar</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f2230 0%, #2a3f58 50%, #f1f3f6 100%)",
    padding: "40px 24px",
    display: "flex",
    justifyContent: "center",
  },
  container: {
    width: "min(1500px, 100%)",
    background: "#f8f9fb",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 24px 80px rgba(15, 34, 48, 0.25)",
    display: "grid",
    gap: 24,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandButton: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    transition: "transform 0.2s ease",
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
  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: 24,
  },
  roleSwitch: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    alignItems: "center",
    background: "#d1d5db",
    borderRadius: 999,
    padding: 4,
    width: 200,
    overflow: "hidden",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
  },
  roleSwitchThumb: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    width: "calc(50% - 4px)",
    borderRadius: 999,
    background: "#0f2230",
    boxShadow: "0 8px 20px rgba(15,34,48,0.3)",
    transition: "transform 0.25s ease",
    zIndex: 0,
  },
  roleSwitchButton: {
    position: "relative",
    zIndex: 1,
    border: "none",
    background: "transparent",
    padding: "6px 0",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    textTransform: "capitalize",
    transition: "color 0.2s ease",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  userAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    position: "relative",
    overflow: "hidden",
    background: "#1f2937",
  },
  userAvatarFallback: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    fontSize: 18,
    color: "#fff",
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f2230",
  },
  tripCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 28,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
    display: "grid",
    gap: 32,
    width: "95%",
    margin: "0 auto",
  },
  tripRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr auto 1.2fr 300px 68px",
    gap: 30,
    alignItems: "stretch",
  },
  locationCard: {
    border: "1px solid #cbd5e1",
    borderRadius: 16,
    padding: "8px 14px",
    background: "#f8fafc",
    display: "grid",
    gap: 3,
  },
  locationLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#475569",
    letterSpacing: 0.6,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f2230",
    lineHeight: 1.3,
  },
  switchIcon: {
    alignSelf: "center",
    justifySelf: "center",
    fontSize: 20,
    color: "#64748b",
  },
  switchWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
  },
  switchButton: {
    border: "1px solid rgba(100,116,139,0.35)",
    background: "#f8fafc",
    borderRadius: "50%",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#475569",
    cursor: "pointer",
  },
  timeCard: {
    border: "1px solid #cbd5e1",
    borderRadius: 16,
    padding: "10px 14px",
    background: "#f8fafc",
    display: "grid",
    gap: 10,
    fontSize: 14,
    color: "#0f2230",
  },
  timeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  timeLabel: {
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 0.5,
    color: "#475569",
  },
  timeValue: {
    fontWeight: 600,
    color: "#0f2230",
  },
  dateInput: {
    border: "none",
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    color: "#0f2230",
    outline: "none",
    width: "100%",
  },
  inputWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid rgba(100,116,139,0.25)",
    borderRadius: 8,
    padding: "3px 8px",
    background: "#fff",
  },
  dateTimeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  dateTimeField: {
    display: "grid",
    gap: 3,
  },
  addTripBtn: {
    border: "none",
    background: "#0f2230",
    color: "#fff",
    borderRadius: 18,
    width: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 24,
    transition: "transform 0.2s ease",
  },
  addTripBtnDisabled: {
    background: "#1e293b",
    opacity: 0.45,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  addTripBtnIcon: {
    lineHeight: 0,
    marginTop: -3,
  },
  tripBody: {
    border: "1px dashed rgba(15,34,48,0.15)",
    borderRadius: 18,
    minHeight: 340,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, rgba(15,34,48,0.02), rgba(15,34,48,0.08))",
    padding: 32,
    textAlign: "center",
  },
  placeholder: {
    fontSize: 16,
    color: "#334155",
    lineHeight: 1.5,
  },
  feedback: {
    fontSize: 16,
    color: "#0f5132",
    background: "rgba(40,167,69,0.12)",
    padding: "18px 24px",
    borderRadius: 14,
    fontWeight: 600,
  },
  availableList: {
    display: "grid",
    gap: 16,
    width: "100%",
  },
  availableItem: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid rgba(15,34,48,0.1)",
    padding: "18px 20px",
    display: "grid",
    gap: 14,
  },
  availableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  availableDriver: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  availableDriverPhoto: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontSize: 18,
  },
  availableDriverPhotoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  availableDriverInfo: {
    display: "grid",
    gap: 2,
  },
  availableDriverName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f2230",
  },
  availableDriverVehicle: {
    fontSize: 12,
    color: "#64748b",
  },
  availableFare: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f2230",
  },
  availableBody: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  availableLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    color: "#475569",
    letterSpacing: 0.5,
  },
  availableValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f2230",
  },
  availableMeta: {
    display: "flex",
    gap: 16,
    fontSize: 12,
    color: "#334155",
  },
  availableAction: {
    border: "none",
    background: "#0f2230",
    color: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
    justifySelf: "flex-end",
  },
  availableActionDisabled: {
    background: "#cbd5e1",
    color: "#64748b",
    cursor: "not-allowed",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.58)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 50,
  },
  modalCard: {
    width: "min(640px, 96vw)",
    background: "#fff",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 32px 80px rgba(15,23,42,0.35)",
    display: "grid",
    gap: 24,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f2230",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },
  modalCloseBtn: {
    border: "none",
    background: "#e2e8f0",
    color: "#0f2230",
    width: 36,
    height: 36,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 18,
  },
  modalLoading: {
    textAlign: "center",
    color: "#0f2230",
  },
  modalEmpty: {
    padding: 16,
    background: "rgba(15,34,48,0.05)",
    borderRadius: 14,
    color: "#334155",
    textAlign: "center",
    lineHeight: 1.6,
  },
  vehicleList: {
    display: "grid",
    gap: 16,
  },
  vehicleCard: {
    display: "grid",
    gridTemplateColumns: "120px 1fr auto",
    alignItems: "center",
    gap: 16,
    border: "1px solid rgba(15,34,48,0.08)",
    borderRadius: 16,
    padding: 12,
    background: "#f8fafc",
    cursor: "pointer",
    textAlign: "left" as const,
  },
  vehicleCardThumb: {
    position: "relative" as const,
    width: "100%",
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
  },
  vehicleCardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  vehicleCardInfo: {
    display: "grid",
    gap: 4,
  },
  vehicleCardName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f2230",
  },
  vehicleCardPlate: {
    fontSize: 13,
    color: "#475569",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  vehicleCardCapacity: {
    fontSize: 12,
    color: "#64748b",
  },
  vehicleCardAction: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f2230",
  },
  vehicleForm: {
    display: "grid",
    gap: 16,
  },
  vehiclePreview: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  vehicleImage: {
    width: 140,
    height: 92,
    objectFit: "cover" as const,
    borderRadius: 12,
  },
  vehicleInfo: {
    display: "grid",
    gap: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f2230",
  },
  vehiclePlate: {
    fontSize: 14,
    color: "#475569",
    fontWeight: 600,
  },
  vehicleCapacity: {
    fontSize: 13,
    color: "#64748b",
  },
  inputLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#475569",
    fontWeight: 600,
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#0f2230",
    width: "100%",
  },
  confirmBtn: {
    background: "#0f2230",
    color: "#fff",
    border: "none",
    borderRadius: 16,
    padding: "12px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryAction: {
    border: "none",
    background: "transparent",
    color: "#0f2230",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left" as const,
  },
  modalSubtitleMuted: {
    color: "#94a3b8",
  },
  modalHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalButtonsRow: {
    display: "flex",
    gap: 12,
    marginTop: 12,
  },
  errorBox: {
    background: "rgba(220,38,38,0.08)",
    color: "#b91c1c",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
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
  backBtn: {
    border: "none",
    background: "#fff",
    color: "#0f2230",
    padding: "10px 18px",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
};
