"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function LandingPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const idToken = localStorage.getItem("idToken");
        if (!idToken) {
          setLoading(false);
          return;
        }

        // Intentar obtener datos de Firestore primero
        try {
          const result = await api.get("/api/users/get", idToken);
          if (result.success && result.user) {
            console.log("Usuario obtenido de Firestore:", result.user);
            console.log("Foto del usuario:", result.user.user_photo);
            setUserData(result.user);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.log("No se encontró usuario en Firestore, intentando Firebase Auth...", apiError);
        }

        // Si no hay datos en Firestore, obtener de Firebase Auth
        try {
          const { auth } = await import("@/lib/firebase");
          const { onAuthStateChanged } = await import("firebase/auth");
          
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
          <div style={styles.user}>
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
          </div>
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
            <label style={styles.srOnly}>From</label>
            <div style={styles.inputWithIcon}> 
              <select style={styles.select} defaultValue="">
                <option value="" disabled>From to</option>
                <option value="point_a">Point A</option>
                <option value="point_b">Point B</option>
                <option value="point_c">Point C</option>
                <option value="point_d">Point D</option>
                <option value="point_e">Point E</option>
              </select>
              <span style={styles.paperPlane} aria-hidden>✈️</span>
              <span style={styles.dropdownArrow} aria-hidden>▼</span>
            </div>

            <label style={styles.srOnly}>To</label>
            <div style={styles.inputWithIcon}>
              <select style={styles.select} defaultValue="">
                <option value="" disabled>To</option>
                <option value="point_a">Point A</option>
                <option value="point_b">Point B</option>
                <option value="point_c">Point C</option>
                <option value="point_d">Point D</option>
                <option value="point_e">Point E</option>
              </select>
              <span style={styles.dropdownArrow} aria-hidden>▼</span>
            </div>

            <div style={styles.row2}> 
              <div style={styles.half}> 
                <label style={styles.smallLabel}>Date</label>
                <input type="date" style={styles.dateInput} />
              </div>
              <div style={styles.half}> 
                <label style={styles.smallLabel}>Hour</label>
                <div style={styles.inputWithIcon}>
                  <select style={styles.hourSelect}>
                    <option value="">Select hour</option>
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

            <div style={styles.buttonsRow}>
              <button style={styles.primaryBtn}>Wheels me</button>
              <button style={styles.secondaryBtn}>My trips</button>
            </div>
          </div>
        </section>

        {/* DERECHA: ESPACIO PARA LA IMAGEN */}
        <aside style={styles.right}> 
          <div style={styles.imagePlaceholder}>
            <div style={styles.imageContainer}>
              <Image
                src="/Group27.png"
                alt="Ilustración de autos y ciudad"
                fill
                sizes="(max-width: 1200px) 520px, 520px"
                style={{ objectFit: "cover", borderRadius: 12 }}
                priority
              />
            </div>
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
};

