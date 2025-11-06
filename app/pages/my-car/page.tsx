"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from "@/lib/firebase";

// Imagen por defecto del carro (usar la segunda imagen proporcionada)
const DEFAULT_CAR_IMAGE = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop";

interface Vehicle {
  vehicle_id: string;
  user_id: string;
  license_plate: string;
  model: string;
  capacity: number;
  SOAT: string;
  photo: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function MyCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    license_plate: "",
    model: "",
    capacity: "",
    SOAT: null as File | null,
    photo: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState("");

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
    fetchVehicles();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const validToken = await ensureValidToken();
      if (!validToken) {
        router.push("/pages/login");
        return;
      }

      const userData = await api.get("/api/me", validToken);
      if (userData) {
        const first = (userData.first_name || "").trim();
        const last = (userData.last_name || "").trim();
        const full = (first || last)
          ? `${first} ${last}`.trim()
          : (userData.email ? userData.email.split("@")[0] : "User");
        setUserName(full);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const validToken = await ensureValidToken();
      if (!validToken) {
        router.push("/pages/login");
        return;
      }

      const response = await api.get("/api/vehicles", validToken);
      if (response && response.vehicles) {
        setVehicles(response.vehicles);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/pages/login", { replace: true });
      setTimeout(() => window.location.replace("/pages/login"), 0);
    } catch (e) {
      alert("No se pudo cerrar sesión");
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "photo" | "SOAT") => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, [field]: e.target.files[0] });
    }
  };

  const uploadPhoto = async (file: File, folder: string = "vehicles"): Promise<string | null> => {
    try {
      initializeFirebase();
      const storage = getStorage();
      const timestamp = Date.now();
      const fileName = `${folder}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload progress:", progress);
          },
          (error) => {
            console.error("Error uploading photo:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error("Error getting download URL:", error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      return null;
    }
  };

  const validateLicensePlate = (plate: string): boolean => {
    // Formato colombiano: 3 letras mayúsculas + 3 números (ej: ABC123)
    const colombianPlateRegex = /^[A-Z]{3}[0-9]{3}$/;
    return colombianPlateRegex.test(plate.trim().toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const plate = formData.license_plate.trim().toUpperCase();
    
    if (!plate || !formData.model.trim() || !formData.capacity || !formData.SOAT) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar formato de placa colombiana
    if (!validateLicensePlate(plate)) {
      alert("La placa debe tener el formato: 3 letras mayúsculas + 3 números (ej: ABC123)");
      return;
    }

    setUploading(true);

    try {
      const validToken = await ensureValidToken();
      if (!validToken) {
        router.push("/pages/login");
        return;
      }

      let photoURL: string | null = null;
      let soatURL: string | null = null;

      // Subir foto del carro si existe
      if (formData.photo) {
        photoURL = await uploadPhoto(formData.photo);
        if (!photoURL) {
          alert("Error al subir la foto del carro. Intenta nuevamente.");
          setUploading(false);
          return;
        }
      }

      // Subir foto del SOAT
      if (formData.SOAT) {
        soatURL = await uploadPhoto(formData.SOAT, "soat");
        if (!soatURL) {
          alert("Error al subir la foto del SOAT. Intenta nuevamente.");
          setUploading(false);
          return;
        }
      }

      // Registrar vehículo
      const response = await api.post(
        "/api/vehicles",
        {
          license_plate: plate, // Ya está en mayúsculas y validado
          model: formData.model.trim(),
          capacity: parseInt(formData.capacity),
          SOAT: soatURL,
          photo: photoURL,
        },
        validToken
      );

      if (response) {
        alert("Vehículo registrado correctamente");
        setShowAddForm(false);
        setFormData({
          license_plate: "",
          model: "",
          capacity: "",
          SOAT: null,
          photo: null,
        });
        await fetchVehicles();
      }
    } catch (error: any) {
      console.error("Error registering vehicle:", error);
      alert("Error al registrar el vehículo. Intenta nuevamente.");
    } finally {
      setUploading(false);
    }
  };

  const nextVehicle = () => {
    if (vehicles.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % vehicles.length);
    }
  };

  const prevVehicle = () => {
    if (vehicles.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + vehicles.length) % vehicles.length);
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

  const currentVehicle = vehicles[currentIndex];

  return (
    <div style={styles.page}>
      <div style={{
        ...styles.container,
        width: isMobile ? "96vw" : "min(1180px, 96vw)",
      }}>
        {/* TOP BAR */}
        <header style={styles.topbar}>
          <button
            style={styles.brandBtn}
            onClick={() => router.push("/pages/login/landing")}
          >
            MoveTogether
          </button>

          {/* Barra azul que ocupa el espacio restante */}
          <div style={styles.fillBar}>
            <div style={styles.toolbar}>
              <button style={styles.iconBtn} onClick={() => dev("Mensajes")}>
                💬
              </button>
              <button style={styles.iconBtn} onClick={() => dev("Notificaciones")}>
                🔔
              </button>
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
          <aside style={styles.sidebar}>
            {[
              { label: "My trips", action: () => dev("My trips") },
              { label: "My Car", action: () => {} },
              { label: "Settings", action: () => dev("Settings") },
              { label: "Help", action: () => dev("Help") },
            ].map((item) => (
              <button
                key={item.label}
                style={{
                  ...styles.sideItem,
                  backgroundColor: item.label === "My Car" ? "#d1d5db" : "transparent",
                }}
                onClick={item.action}
              >
                <span>{item.label}</span>
                <span style={{ fontWeight: 700 }}>+</span>
              </button>
            ))}
            {/* Cerrar sesión */}
            <button style={styles.sideItem} onClick={handleLogout}>
              <span>Close session</span>
              <span style={{ fontWeight: 700 }}>+</span>
            </button>
          </aside>

          {/* MAIN */}
          <main style={styles.main}>
            <div style={styles.headerSection}>
              <h2 style={styles.sectionTitle}>My cars</h2>
              <button
                style={styles.addBtn}
                onClick={() => setShowAddForm(true)}
                title="Agregar carro"
              >
                <span style={styles.addIcon}>+</span>
              </button>
            </div>

            {/* CONTENIDO */}
            {vehicles.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🚗</div>
                <div style={styles.emptyText}>No tienes carros registrados</div>
                <button
                  style={styles.emptyBtn}
                  onClick={() => setShowAddForm(true)}
                >
                  Agregar mi primer carro
                </button>
              </div>
            ) : (
              <section style={{
                ...styles.cardWide,
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              }}>
                {/* Imagen del carro */}
                <div style={styles.carImageContainer}>
                  <img
                    src={currentVehicle?.photo || DEFAULT_CAR_IMAGE}
                    alt={currentVehicle?.model || "Car"}
                    style={styles.carImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_CAR_IMAGE;
                    }}
                  />
                </div>

                {/* Información del carro */}
                <div style={styles.carInfo}>
                  <div style={styles.carField}>
                    <div style={styles.fieldLabel}>Plate</div>
                    <div style={styles.fieldValue}>{currentVehicle?.license_plate || "—"}</div>
                  </div>
                  <div style={styles.carField}>
                    <div style={styles.fieldLabel}>Model</div>
                    <div style={styles.fieldValue}>{currentVehicle?.model || "—"}</div>
                  </div>
                  <div style={styles.carField}>
                    <div style={styles.fieldLabel}>Capacity</div>
                    <div style={styles.fieldValue}>{currentVehicle?.capacity || "—"}</div>
                  </div>
                  <div style={styles.carField}>
                    <div style={styles.fieldLabel}>SOAT</div>
                    <div style={styles.fieldValue}>
                      {currentVehicle?.SOAT ? (
                        <a
                          href={currentVehicle.SOAT}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.soatLink}
                        >
                          <img
                            src={currentVehicle.SOAT}
                            alt="SOAT"
                            style={styles.soatImage}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.textContent = "Ver foto";
                              }
                            }}
                          />
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                </div>

                {/* Controles del carrusel */}
                {vehicles.length > 1 && (
                  <div style={styles.carouselControls}>
                    <button
                      style={styles.carouselBtn}
                      onClick={prevVehicle}
                      aria-label="Carro anterior"
                    >
                      ←
                    </button>
                    <div style={styles.carouselIndicators}>
                      {vehicles.map((_, index) => (
                        <button
                          key={index}
                          style={{
                            ...styles.indicator,
                            backgroundColor: index === currentIndex ? "#0b5fff" : "#d1d5db",
                          }}
                          onClick={() => setCurrentIndex(index)}
                          aria-label={`Ir al carro ${index + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      style={styles.carouselBtn}
                      onClick={nextVehicle}
                      aria-label="Siguiente carro"
                    >
                      →
                    </button>
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>

      {/* MODAL PARA AGREGAR CARRO */}
      {showAddForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Agregar nuevo carro</h3>
              <button
                style={styles.modalClose}
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    license_plate: "",
                    model: "",
                    capacity: "",
                    SOAT: null,
                    photo: null,
                  });
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Placa *</label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => {
                    // Convertir a mayúsculas automáticamente y limitar caracteres
                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    // Limitar a 6 caracteres (3 letras + 3 números)
                    if (value.length > 6) {
                      value = value.slice(0, 6);
                    }
                    setFormData({ ...formData, license_plate: value });
                  }}
                  onBlur={(e) => {
                    // Formatear visualmente al perder foco (ej: ABC123)
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length === 6) {
                      setFormData({ ...formData, license_plate: value });
                    }
                  }}
                  style={styles.formInput}
                  placeholder="ABC123 (3 letras + 3 números)"
                  maxLength={6}
                  pattern="[A-Z]{3}[0-9]{3}"
                  required
                />
                {formData.license_plate && (
                  <div style={{
                    fontSize: 12,
                    color: validateLicensePlate(formData.license_plate) ? "#10b981" : "#ef4444",
                    marginTop: 4,
                  }}>
                    {validateLicensePlate(formData.license_plate)
                      ? "✓ Formato correcto"
                      : "Formato: 3 letras mayúsculas + 3 números (ej: ABC123)"}
                  </div>
                )}
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Modelo *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  style={styles.formInput}
                  placeholder="Ej: Volkswagen Jetta"
                  required
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Capacidad *</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  style={styles.formInput}
                  placeholder="Ej: 4"
                  min="1"
                  required
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>SOAT (Foto) *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "SOAT")}
                  style={styles.formInput}
                  required
                />
                {formData.SOAT && (
                  <div style={styles.preview}>
                    <img
                      src={URL.createObjectURL(formData.SOAT)}
                      alt="Preview SOAT"
                      style={styles.previewImage}
                    />
                  </div>
                )}
              </div>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Foto del carro</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "photo")}
                  style={styles.formInput}
                />
                {formData.photo && (
                  <div style={styles.preview}>
                    <img
                      src={URL.createObjectURL(formData.photo)}
                      alt="Preview carro"
                      style={styles.previewImage}
                    />
                  </div>
                )}
              </div>
              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    license_plate: "",
                    model: "",
                    capacity: "",
                    SOAT: null,
                    photo: null,
                  });
                }}
                disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                  disabled={uploading}
                >
                  {uploading ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------- STYLES -------- */
const styles: any = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
    padding: 24,
    display: "grid",
    placeItems: "center",
  },
  container: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
    overflow: "hidden",
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
  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    margin: "6px 0 10px 2px",
    fontSize: 22,
    fontWeight: 800,
    color: "#0f2230",
  },
  addBtn: {
    background: "#0b0b0b",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: 24,
    fontWeight: 300,
  },
  addIcon: {
    lineHeight: 1,
  },
  cardWide: {
    background: "#e5e7eb",
    borderRadius: 10,
    padding: 24,
    display: "grid",
    gap: 20,
    gridTemplateColumns: "1fr 1fr",
    alignItems: "start",
  },
  carImageContainer: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
    background: "#d1d5db",
  },
  carImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  carInfo: {
    display: "grid",
    gap: 16,
  },
  carField: {
    background: "#f3f4f6",
    borderRadius: 10,
    padding: 14,
    display: "grid",
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  soatLink: {
    color: "#0b5fff",
    textDecoration: "underline",
    cursor: "pointer",
    display: "inline-block",
  },
  soatImage: {
    maxWidth: "100%",
    maxHeight: 200,
    borderRadius: 8,
    cursor: "pointer",
    border: "2px solid #0b5fff",
  },
  preview: {
    marginTop: 8,
    display: "grid",
    placeItems: "center",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: 200,
    borderRadius: 8,
    border: "2px solid #d1d5db",
  },
  carouselControls: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  carouselBtn: {
    background: "#0b5fff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: 20,
    fontWeight: 700,
  },
  carouselIndicators: {
    display: "flex",
    gap: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
  },
  emptyState: {
    background: "#e5e7eb",
    borderRadius: 10,
    padding: 60,
    display: "grid",
    placeItems: "center",
    gap: 16,
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyText: {
    fontSize: 18,
    color: "#6b7280",
    fontWeight: 600,
  },
  emptyBtn: {
    background: "#0b5fff",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
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
    maxHeight: "90vh",
    overflowY: "auto",
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
  form: {
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
  formActions: {
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

