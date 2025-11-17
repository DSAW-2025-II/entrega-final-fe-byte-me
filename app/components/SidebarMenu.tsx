"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/app/contexts/ThemeContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { clearTokens } from "@/lib/auth";

interface SidebarMenuProps {
  active?: "trips" | "my-car" | "profile" | "settings" | "help";
  onLogout?: () => void;
}

export default function SidebarMenu({ active, onLogout }: SidebarMenuProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
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
    }
  };

  const menuItems = [
    { label: "My trips", path: "/pages/trips", key: "trips" as const },
    { label: "My Car", path: "/pages/my-car", key: "my-car" as const },
    { label: "My Profile", path: "/pages/user", key: "profile" as const },
    { label: "Settings", path: "/pages/settings", key: "settings" as const },
    { label: "Help", path: "/pages/help", key: "help" as const },
  ];

  const handleItemClick = (path: string, key: string) => {
    if (key === active) return; // No navegar si ya está activo
    router.push(path);
  };

  const sidebarStyle: React.CSSProperties = {
    background: theme === "dark" ? "#111111" : "#111111",
    borderRadius: 16,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: "fit-content",
    width: "100%",
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "transparent",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#ffffff",
    textAlign: "left",
    width: "100%",
    minHeight: 44,
    transition: "background-color 0.2s ease",
  };

  const activeItemStyle: React.CSSProperties = {
    ...itemStyle,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#ffffff",
    fontWeight: 600,
  };

  return (
    <aside style={sidebarStyle}>
      {menuItems.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            style={isActive ? activeItemStyle : itemStyle}
            onClick={() => handleItemClick(item.path, item.key)}
            disabled={isActive}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span>{item.label}</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>+</span>
          </button>
        );
      })}
      <button
        style={itemStyle}
        onClick={handleLogout}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <span>Close session</span>
        <span style={{ fontWeight: 700, fontSize: 16 }}>+</span>
      </button>
    </aside>
  );
}

