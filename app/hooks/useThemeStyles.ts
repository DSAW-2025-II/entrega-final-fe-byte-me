import { useTheme } from "../contexts/ThemeContext";

export function useThemeStyles() {
  const { theme, language } = useTheme();

  const getThemeColors = () => {
    if (theme === "dark") {
      return {
        background: "#0a0a0a",
        foreground: "#ededed",
        cardBackground: "#1a1a1a",
        cardBorder: "#2a2a2a",
        textPrimary: "#ededed",
        textSecondary: "#a0a0a0",
        inputBackground: "#1a1a1a",
        inputBorder: "#444",
        buttonPrimary: "#0b5fff",
        buttonPrimaryHover: "#0052cc",
      };
    } else {
      return {
        background: "#ffffff",
        foreground: "#171717",
        cardBackground: "#ffffff",
        cardBorder: "#e5e7eb",
        textPrimary: "#111827",
        textSecondary: "#6b7280",
        inputBackground: "#fff",
        inputBorder: "#d1d5db",
        buttonPrimary: "#0b5fff",
        buttonPrimaryHover: "#0052cc",
      };
    }
  };

  const getPageStyle = () => ({
    background: theme === "dark" 
      ? "linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #0a0a0a 100%)"
      : "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
    color: theme === "dark" ? "#ededed" : "#111827",
  });

  const getCardStyle = () => ({
    background: theme === "dark" ? "#1a1a1a" : "#fff",
    border: `1px solid ${theme === "dark" ? "#2a2a2a" : "#e5e7eb"}`,
    color: theme === "dark" ? "#ededed" : "#111827",
  });

  const getInputStyle = () => ({
    background: theme === "dark" ? "#1a1a1a" : "#fff",
    border: `1px solid ${theme === "dark" ? "#444" : "#d1d5db"}`,
    color: theme === "dark" ? "#ededed" : "#111827",
  });

  return {
    theme,
    language,
    colors: getThemeColors(),
    pageStyle: getPageStyle(),
    cardStyle: getCardStyle(),
    inputStyle: getInputStyle(),
  };
}




