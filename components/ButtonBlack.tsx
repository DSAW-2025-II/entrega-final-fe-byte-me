import React from "react";

interface ButtonBlackProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function ButtonBlack({ 
  children, 
  onClick, 
  disabled = false,
  type = "button" 
}: ButtonBlackProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 46,
        background: disabled ? "#ccc" : "#111",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "#333";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = "#111";
      }}
    >
      {children}
    </button>
  );
}



