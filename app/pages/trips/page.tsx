"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useUser } from "@/app/contexts/UserContext";
import NotificationButton from "@/app/components/NotificationButton";
import UserPageLayout from "@/app/components/UserPageLayout";
import MyTrips from "@/components/MyTrips";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

export default function MyTripsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, refreshUser } = useUser();
  const { loading: authLoading } = useAuthGuard({ requireAuth: true });
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [userData, setUserData] = useState<any>(null);

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

  // Mostrar loader mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6f8" }}>
        <div style={{ fontSize: 16, color: "#666" }}>Cargando...</div>
      </div>
    );
  }

  useEffect(() => {
    refreshUser();
    const fetchUserData = async () => {
      try {
        const token = await ensureValidToken();
        if (token) {
          const meResponse = await api.get("/api/me", token);
          if (meResponse) {
            setUserData(meResponse);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [refreshUser]);

  const fullName = userData 
    ? `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "Usuario"
    : user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Usuario"
    : "Usuario";

    return (
    <UserPageLayout active="trips">
        <header
          style={{
            ...styles.topbar,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 12 : 12,
            padding: isMobile ? "16px" : "20px",
            background: theme === "dark" ? "#2a2a2a" : "transparent",
          marginBottom: 24,
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
              <NotificationButton />
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

      <MyTrips user={user} userData={userData} onRefreshUser={refreshUser} />
    </UserPageLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
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

