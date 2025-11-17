"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function NotificationButton() {
  const { theme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const token = await ensureValidToken();
      if (!token) {
        return;
      }

      const response = await api.get("/api/notifications", token);
      if (response && Array.isArray(response.notifications)) {
        setNotifications(response.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error: any) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const handleToggleNotifications = useCallback(() => {
    if (!showNotifications) {
      loadNotifications();
    }
    setShowNotifications(!showNotifications);
  }, [showNotifications, loadNotifications]);

  const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: `1px solid ${theme === "dark" ? "#334155" : "#e5e7eb"}`,
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    color: theme === "dark" ? "#ffffff" : "#0f2230",
  };

  return (
    <>
      <button
        style={{
          ...iconBtnStyle,
          ...(showNotifications ? { borderColor: "#3b82f6", borderWidth: 2 } : {}),
        }}
        title="Notificaciones"
        onClick={handleToggleNotifications}
      >
        🔔
      </button>

      {/* Modal de Notificaciones */}
      {showNotifications && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowNotifications(false)}
        >
          <div
            style={{
              background: theme === "dark" ? "#0f2230" : "#ffffff",
              borderRadius: 16,
              width: "90%",
              maxWidth: 500,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: 20,
                borderBottom: `1px solid ${theme === "dark" ? "#1e293b" : "#e5e7eb"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: theme === "dark" ? "#ffffff" : "#0f2230",
                }}
              >
                Notificaciones
              </h2>
              <button
                onClick={() => setShowNotifications(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: theme === "dark" ? "#ffffff" : "#0f2230",
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                overflowY: "auto",
                flex: 1,
                padding: 16,
              }}
            >
              {notificationsLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: theme === "dark" ? "#94a3b8" : "#64748b",
                  }}
                >
                  Cargando notificaciones...
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: theme === "dark" ? "#94a3b8" : "#64748b",
                  }}
                >
                  No tienes notificaciones
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: 16,
                      marginBottom: 12,
                      borderRadius: 12,
                      background: notif.read
                        ? theme === "dark" ? "#1e293b" : "#f9fafb"
                        : theme === "dark" ? "#1e3a5f" : "#eff6ff",
                      border: `1px solid ${theme === "dark" ? "#334155" : "#e5e7eb"}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: theme === "dark" ? "#cbd5e1" : "#475569",
                        marginBottom: 8,
                      }}
                    >
                      {notif.createdAt
                        ? new Date(notif.createdAt.seconds * 1000 || notif.createdAt).toLocaleString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Fecha desconocida"}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        color: theme === "dark" ? "#ffffff" : "#0f2230",
                        fontWeight: notif.read ? 400 : 600,
                      }}
                    >
                      {notif.message || "Sin mensaje"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

