"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      gap: 20,
      fontFamily: "ui-sans-serif",
    }}>
      <h2>Algo salió mal</h2>
      <p>{error.message || "Ocurrió un error inesperado"}</p>
      <button
        onClick={() => reset()}
        style={{
          padding: "10px 20px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        Intentar de nuevo
      </button>
      <a
        href="/pages/login"
        style={{
          padding: "10px 20px",
          background: "transparent",
          color: "#111",
          border: "1px solid #111",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 16,
        }}
      >
        Volver al login
      </a>
    </div>
  );
}



