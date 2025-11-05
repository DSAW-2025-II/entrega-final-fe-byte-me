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
    }}>
      <h2>Algo salió mal</h2>
      <button
        onClick={() => reset()}
        style={{
          padding: "10px 20px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Intentar de nuevo
      </button>
      <details style={{ marginTop: 20 }}>
        <summary>Detalles del error</summary>
        <pre style={{ background: "#f5f5f5", padding: 10, borderRadius: 4 }}>
          {error.message}
        </pre>
      </details>
    </div>
  );
}

