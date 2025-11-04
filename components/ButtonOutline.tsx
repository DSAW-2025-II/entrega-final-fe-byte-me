import React from "react";

interface ButtonOutlineProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function ButtonOutline({ 
  children, 
  onClick, 
  disabled = false,
  type = "button" 
}: ButtonOutlineProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 46,
        background: "transparent",
        color: disabled ? "#999" : "#111",
        border: `1px solid ${disabled ? "#ccc" : "#111"}`,
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "#f5f5f5";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

