"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
type Language = "es" | "en";

interface ThemeContextType {
  theme: Theme;
  language: Language;
  notifications: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setNotifications: (notifications: boolean) => void;
  saveSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<Language>("es");
  const [notifications, setNotificationsState] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Cargar configuración del localStorage al montar
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedLanguage = localStorage.getItem("language") as Language | null;
    const storedNotifications = localStorage.getItem("notifications");
    
    if (storedTheme) setThemeState(storedTheme);
    if (storedLanguage) setLanguageState(storedLanguage);
    if (storedNotifications !== null) {
      setNotificationsState(storedNotifications === "true");
    }
    
    setMounted(true);
  }, []);

  // Función para aplicar el tema (se llama cuando cambia y también se exporta)
  const applyThemeToDOM = (currentTheme: Theme) => {
    if (typeof window === "undefined") return;
    
    const html = document.documentElement;
    const body = document.body;
    
    // Remover clases anteriores
    html.classList.remove("theme-light", "theme-dark");
    body.classList.remove("theme-light", "theme-dark");
    
    if (currentTheme === "dark") {
      html.style.colorScheme = "dark";
      html.setAttribute("data-theme", "dark");
      html.classList.add("theme-dark");
      body.classList.add("theme-dark");
      document.documentElement.style.setProperty("--background", "#0a0a0a");
      document.documentElement.style.setProperty("--foreground", "#ededed");
      document.documentElement.style.setProperty("--card-background", "#1a1a1a");
      document.documentElement.style.setProperty("--card-border", "#2a2a2a");
      body.style.backgroundColor = "#0a0a0a";
      body.style.color = "#ededed";
      
      // Aplicar a todos los contenedores principales
      const containers = document.querySelectorAll('[data-theme-container]');
      containers.forEach((el: any) => {
        el.style.backgroundColor = "#1a1a1a";
        el.style.color = "#ededed";
      });
    } else {
      html.style.colorScheme = "light";
      html.setAttribute("data-theme", "light");
      html.classList.add("theme-light");
      body.classList.add("theme-light");
      document.documentElement.style.setProperty("--background", "#ffffff");
      document.documentElement.style.setProperty("--foreground", "#171717");
      document.documentElement.style.setProperty("--card-background", "#ffffff");
      document.documentElement.style.setProperty("--card-border", "#e5e7eb");
      body.style.backgroundColor = "#ffffff";
      body.style.color = "#171717";
      
      // Aplicar a todos los contenedores principales
      const containers = document.querySelectorAll('[data-theme-container]');
      containers.forEach((el: any) => {
        el.style.backgroundColor = "";
        el.style.color = "";
      });
    }
    
    // Forzar repintado
    void body.offsetHeight;
  };

  // Aplicar tema cuando cambia
  useEffect(() => {
    if (!mounted) return;
    applyThemeToDOM(theme);
  }, [theme, mounted]);

  // Aplicar idioma cuando cambia
  useEffect(() => {
    if (!mounted) return;
    
    if (typeof window !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const setNotifications = (newNotifications: boolean) => {
    setNotificationsState(newNotifications);
  };

  // Guardar automáticamente cuando cambian los valores (solo si ya está montado)
  useEffect(() => {
    if (!mounted) return;
    
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
      localStorage.setItem("language", language);
      localStorage.setItem("notifications", notifications.toString());
    }
  }, [theme, language, notifications, mounted]);

  const saveSettings = () => {
    // Esta función ya no es necesaria porque los valores se guardan automáticamente
    // Pero la mantenemos para compatibilidad con el código existente
    if (typeof window === "undefined") return;
    
    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);
    localStorage.setItem("notifications", notifications.toString());
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        language,
        notifications,
        setTheme,
        setLanguage,
        setNotifications,
        saveSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

