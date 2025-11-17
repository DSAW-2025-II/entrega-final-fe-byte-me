"use client";

import { ReactNode, useState, useEffect } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";
import SidebarMenu from "./SidebarMenu";

interface UserPageLayoutProps {
  children: ReactNode;
  active?: "trips" | "my-car" | "profile" | "settings" | "help";
  onLogout?: () => void;
}

export default function UserPageLayout({
  children,
  active,
  onLogout,
}: UserPageLayoutProps) {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: isMobile ? "16px 12px" : "24px",
    background:
      theme === "dark"
        ? "linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #0a0a0a 100%)"
        : "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
    display: "flex",
    justifyContent: "center",
  };

  const containerStyle: React.CSSProperties = {
    width: "min(1400px, 100%)",
    maxWidth: "1400px",
    background: theme === "dark" ? "#1a1a1a" : "#fff",
    borderRadius: 24,
    boxShadow: "0 18px 60px rgba(0,0,0,.18)",
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : isTablet
      ? "240px 1fr"
      : "260px 1fr",
    gap: 24,
    padding: isMobile ? "16px" : "24px",
    alignItems: "start",
    minHeight: "calc(100vh - 48px)",
  };

  const sidebarContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    order: isMobile ? 2 : 1,
  };

  const mainStyle: React.CSSProperties = {
    paddingRight: isMobile ? 0 : 6,
    order: isMobile ? 1 : 2,
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={sidebarContainerStyle}>
          <SidebarMenu active={active} onLogout={onLogout} />
        </div>
        <main style={mainStyle}>{children}</main>
      </div>
    </div>
  );
}

