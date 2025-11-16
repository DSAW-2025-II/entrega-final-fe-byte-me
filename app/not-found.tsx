export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      gap: 20,
    }}>
      <h2>404 - Página no encontrada</h2>
      <a
        href="/pages/login"
        style={{
          padding: "10px 20px",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 8,
        }}
      >
        Volver al login
      </a>
    </div>
  );
}



