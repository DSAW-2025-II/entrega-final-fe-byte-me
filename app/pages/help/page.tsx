"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";
import { auth as clientAuth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function HelpPage() {
  const router = useRouter();
  const { theme, language } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // FAQs con traducciones
  const faqs = language === "es" ? [
    {
      question: "¿Cómo me registro en un viaje?",
      answer: "Para registrarte en un viaje, ve a la sección 'My trips' y busca viajes disponibles. Haz clic en el viaje que te interese y presiona el botón 'Unirse al viaje'. Asegúrate de tener tu perfil completo y tu carro registrado antes de unirte."
    },
    {
      question: "¿Cómo agrego o elimino mi coche?",
      answer: "Ve a la sección 'My Car' desde el menú lateral. Para agregar un carro, presiona el botón '+' y completa el formulario con la información de tu vehículo. Para eliminar un carro, asegúrate de tener más de 2 carros registrados y usa el botón 'Eliminar vehículo' en la información del carro."
    },
    {
      question: "¿Qué hago si olvidé mi contraseña?",
      answer: "Ve a la pantalla de inicio de sesión y haz clic en '¿Olvidaste tu contraseña?'. Ingresa tu correo institucional (@unisabana.edu.co) y te enviaremos un enlace para restablecerla."
    }
  ] : [
    {
      question: "How do I register for a trip?",
      answer: "To register for a trip, go to the 'My trips' section and search for available trips. Click on the trip you're interested in and press the 'Join trip' button. Make sure you have your complete profile and your car registered before joining."
    },
    {
      question: "How do I add or remove my car?",
      answer: "Go to the 'My Car' section from the side menu. To add a car, press the '+' button and complete the form with your vehicle information. To delete a car, make sure you have more than 2 cars registered and use the 'Delete vehicle' button in the car information."
    },
    {
      question: "What do I do if I forgot my password?",
      answer: "Go to the login page and click 'Forgot your password?'. Enter your institutional email (@unisabana.edu.co) and you'll receive a reset link."
    }
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkMedia = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMedia();
    window.addEventListener("resize", checkMedia);
    
    return () => {
      window.removeEventListener("resize", checkMedia);
    };
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const { auth: clientAuth } = await import("@/lib/firebaseClient");
      const u = clientAuth?.currentUser;
      if (!u) {
        router.push("/pages/login");
        return;
      }
      const full = u.displayName || (u.email ? u.email.split("@")[0] : "User");
      setUserName(full);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (!clientAuth) {
        router.replace("/pages/login");
        return;
      }
      await signOut(clientAuth);
      router.replace("/pages/login");
      setTimeout(() => window.location.replace("/pages/login"), 0);
    } catch (e) {
      alert("No se pudo cerrar sesión");
      console.error(e);
    }
  };

  const handleReportProblem = async () => {
    if (!problemDescription.trim()) {
      alert(language === "es" ? "Por favor describe el problema" : "Please describe the problem");
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      // Obtener información del usuario
      let userEmail = "";
      let userName = "";
      
      try {
        const { auth: clientAuth } = await import("@/lib/firebaseClient");
        const u = clientAuth?.currentUser;
        if (u) {
          userEmail = u.email || "";
          userName = u.displayName || "";
        }
      } catch (error) {
        console.warn("No se pudo obtener información del usuario:", error);
      }

      // Enviar reporte al backend
      await api.post("/api/contact", {
        type: "report",
        message: problemDescription.trim(),
        userEmail: userEmail,
        userName: userName,
      });
      
      setSubmitSuccess(true);
      setProblemDescription("");
      
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error enviando reporte:", error);
      alert(language === "es" 
        ? "Error al enviar el reporte. Intenta nuevamente." 
        : "Error sending report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendSupportMessage = async () => {
    if (!supportMessage.trim()) {
      alert(language === "es" ? "Por favor escribe tu mensaje" : "Please write your message");
      return;
    }

    setSubmittingSupport(true);
    setSupportSuccess(false);

    try {
      // Obtener información del usuario
      let userEmail = "";
      let currentUserName = "";
      
      try {
        const { auth: clientAuth } = await import("@/lib/firebaseClient");
        const u = clientAuth?.currentUser;
        if (u) {
          userEmail = u.email || "";
          currentUserName = u.displayName || "";
        }
      } catch (error) {
        console.warn("No se pudo obtener información del usuario:", error);
      }

      // Enviar mensaje de soporte al backend
      await api.post("/api/contact", {
        type: "support",
        message: supportMessage.trim(),
        userEmail: userEmail,
        userName: currentUserName,
      });
      
      setSupportSuccess(true);
      setSupportMessage("");
      
      setTimeout(() => {
        setSupportSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error enviando mensaje de soporte:", error);
      alert(language === "es" 
        ? "Error al enviar el mensaje. Intenta nuevamente." 
        : "Error sending message. Please try again.");
    } finally {
      setSubmittingSupport(false);
    }
  };

  const dev = (l: string) => alert(`${l}: en desarrollo`);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div>Cargando…</div>
      </div>
    );
  }

  // Aplicar estilos dinámicos según el tema
  const pageStyle = {
    ...styles.page,
    background: theme === "dark" 
      ? "linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 30%, #0a0a0a 100%)"
      : "linear-gradient(180deg, #cfd8e3 0%, #e8edf3 30%, #0f2230 100%)",
  };
  
  const containerStyle = {
    ...styles.container,
    width: isMobile ? "96vw" : "min(1180px, 96vw)",
    background: theme === "dark" ? "#1a1a1a" : "#fff",
    color: theme === "dark" ? "#ededed" : "#111827",
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* TOP BAR */}
        <header style={{
          ...styles.topbar,
          background: theme === "dark" ? "#2a2a2a" : "transparent",
        }}>
          <button
            style={{
              ...styles.brandBtn,
              color: theme === "dark" ? "#ededed" : "#0f2230",
            }}
            onClick={() => router.push("/pages/login/landing")}
          >
            MoveTogether
          </button>

          <div style={styles.fillBar}>
            <div style={styles.toolbar}>
              <button style={styles.iconBtn} onClick={() => dev("Mensajes")}>
                💬
              </button>
              <button style={styles.iconBtn} onClick={() => dev("Notificaciones")}>
                🔔
              </button>
              <div style={styles.userPill}>
                <div style={styles.userCircle}>👤</div>
                <span>{userName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div
          style={{
            ...styles.body,
            gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
          }}
        >
          {/* SIDEBAR */}
          <aside style={{
            ...styles.sidebar,
            background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
          }}>
            {[
              { label: "My trips", action: () => dev("My trips") },
              { label: "My Car", action: () => router.push("/pages/my-car") },
              { label: "My Profile", action: () => router.push("/pages/user") },
              { label: "Settings", action: () => router.push("/pages/settings") },
              { label: "Help", action: () => {} },
            ].map((item) => (
              <button
                key={item.label}
                style={{
                  ...styles.sideItem,
                  backgroundColor: item.label === "Help" ? "#d1d5db" : "transparent",
                }}
                onClick={item.action}
              >
                <span>{item.label}</span>
                <span style={{ fontWeight: 700 }}>+</span>
              </button>
            ))}
            <button style={styles.sideItem} onClick={handleLogout}>
              <span>Close session</span>
              <span style={{ fontWeight: 700 }}>+</span>
            </button>
          </aside>

          {/* MAIN */}
          <main style={styles.main}>
            <h2 style={{
              ...styles.sectionTitle,
              color: theme === "dark" ? "#ededed" : "#0f2230",
            }}>{language === "es" ? "Help" : "Help"}</h2>
            <p style={{
              ...styles.description,
              color: theme === "dark" ? "#a0a0a0" : "#6b7280",
            }}>
              {language === "es" 
                ? "Encuentra respuestas o contáctanos si algo no funciona."
                : "Find answers or contact us if something doesn't work."}
            </p>

            {/* FAQ Section */}
            <section style={{
              ...styles.card,
              background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
            }}>
              <h3 style={{
                ...styles.cardTitle,
                color: theme === "dark" ? "#ededed" : "#0f2230",
              }}>FAQ</h3>
              <div style={styles.faqList}>
                {faqs.map((faq, index) => (
                  <div key={index} style={styles.faqItem}>
                    <button
                      style={styles.faqQuestion}
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    >
                      <span>{faq.question}</span>
                      <span style={styles.faqIcon}>
                        {expandedFaq === index ? "−" : "+"}
                      </span>
                    </button>
                    {expandedFaq === index && (
                      <div style={styles.faqAnswer}>{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Support Section */}
            <section style={{
              ...styles.card,
              background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
            }}>
              <h3 style={{
                ...styles.cardTitle,
                color: theme === "dark" ? "#ededed" : "#0f2230",
              }}>{language === "es" ? "Contact Support" : "Contact Support"}</h3>
              <p style={styles.cardDescription}>
                {language === "es" 
                  ? "¿Necesitas ayuda adicional? Escríbenos y te responderemos lo antes posible."
                  : "Need additional help? Write to us and we'll respond as soon as possible."}
              </p>
              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  {language === "es" ? "Tu mensaje:" : "Your message:"}
                </label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  style={styles.textarea}
                  placeholder={language === "es" 
                    ? "Escribe tu mensaje de soporte..."
                    : "Write your support message..."}
                  rows={4}
                />
              </div>
              {supportSuccess && (
                <div style={styles.success}>
                  {language === "es" 
                    ? "✓ Mensaje enviado correctamente. Te responderemos pronto."
                    : "✓ Message sent successfully. We'll respond soon."}
                </div>
              )}
              <button
                onClick={handleSendSupportMessage}
                style={styles.contactBtn}
                disabled={submittingSupport || !supportMessage.trim()}
              >
                {submittingSupport 
                  ? (language === "es" ? "Enviando..." : "Sending...")
                  : (language === "es" ? "Enviar mensaje a soporte" : "Send support message")}
              </button>
            </section>

            {/* Report a Problem Section */}
            <section style={{
              ...styles.card,
              background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
            }}>
              <h3 style={{
                ...styles.cardTitle,
                color: theme === "dark" ? "#ededed" : "#0f2230",
              }}>{language === "es" ? "Report a Problem" : "Report a Problem"}</h3>
              <div style={styles.formField}>
                <label style={styles.formLabel}>
                  {language === "es" ? "Describe el problema:" : "Describe the problem:"}
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  style={styles.textarea}
                  placeholder={language === "es" 
                    ? "Describe el problema que estás experimentando..."
                    : "Describe the problem you're experiencing..."}
                  rows={4}
                />
              </div>
              {submitSuccess && (
                <div style={styles.success}>
                  {language === "es" 
                    ? "✓ Reporte enviado correctamente. Te contactaremos pronto."
                    : "✓ Report sent successfully. We'll contact you soon."}
                </div>
              )}
              <button
                style={styles.submitBtn}
                onClick={handleReportProblem}
                disabled={submitting || !problemDescription.trim()}
              >
                {submitting 
                  ? (language === "es" ? "Enviando..." : "Sending...")
                  : (language === "es" ? "Enviar" : "Send")}
              </button>
            </section>

            {/* Terms & Privacy Section */}
            <section style={{
              ...styles.card,
              background: theme === "dark" ? "#2a2a2a" : "#e5e7eb",
            }}>
              <h3 style={{
                ...styles.cardTitle,
                color: theme === "dark" ? "#ededed" : "#0f2230",
              }}>{language === "es" ? "Terms & Privacy" : "Terms & Privacy"}</h3>
              <div style={styles.linksContainer}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(language === "es" 
                      ? "Términos y Condiciones - En desarrollo"
                      : "Terms and Conditions - In development");
                  }}
                  style={styles.link}
                >
                  {language === "es" ? "Ver Términos y Condiciones" : "View Terms and Conditions"}
                </a>
                <span style={styles.separator}>|</span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(language === "es" 
                      ? "Política de Privacidad - En desarrollo"
                      : "Privacy Policy - In development");
                  }}
                  style={styles.link}
                >
                  {language === "es" ? "Política de Privacidad" : "Privacy Policy"}
                </a>
              </div>
            </section>

            {/* Final Message */}
            <div style={styles.finalMessage}>
              {language === "es" 
                ? "Si no encuentras lo que buscas, escríbenos. ¡Estamos para ayudarte! 💬"
                : "If you can't find what you're looking for, write to us. We're here to help! 💬"}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    padding: 24,
    display: "grid",
    placeItems: "center",
    transition: "background 0.3s ease",
  },
  container: {
    borderRadius: 12,
    boxShadow: "0 18px 50px rgba(0,0,0,0.12)",
    overflow: "hidden",
    transition: "background 0.3s ease, color 0.3s ease",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 20,
  },
  brandBtn: {
    background: "none",
    border: "none",
    fontWeight: 800,
    fontSize: 20,
    color: "#0f2230",
    cursor: "pointer",
  },
  fillBar: {
    flex: 1,
    background: "#0b0b0b",
    borderRadius: 18,
    padding: 6,
    display: "flex",
    alignItems: "center",
  },
  toolbar: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "2px solid #fff",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
  },
  userPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#fff",
    padding: "0 10px",
  },
  userCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "#1e293b",
    display: "grid",
    placeItems: "center",
  },
  body: {
    display: "grid",
    gap: 20,
    padding: "0 20px 24px 20px",
    alignItems: "start",
  },
  sidebar: {
    background: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    display: "grid",
    gap: 8,
  },
  sideItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "transparent",
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
  },
  main: {
    paddingRight: 6,
  },
  sectionTitle: {
    margin: "6px 0 10px 2px",
    fontSize: 22,
    fontWeight: 800,
    color: "#0f2230",
  },
  description: {
    margin: "0 0 20px 2px",
    fontSize: 14,
    color: "#6b7280",
  },
  card: {
    background: "#e5e7eb",
    borderRadius: 10,
    padding: 24,
    marginBottom: 20,
    display: "grid",
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f2230",
    margin: 0,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    margin: 0,
  },
  faqList: {
    display: "grid",
    gap: 12,
  },
  faqItem: {
    background: "#f3f4f6",
    borderRadius: 8,
    overflow: "hidden",
  },
  faqQuestion: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    textAlign: "left",
  },
  faqIcon: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0b5fff",
  },
  faqAnswer: {
    padding: "0 16px 14px 16px",
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 1.6,
  },
  contactBtn: {
    background: "#0b5fff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    width: "fit-content",
  },
  formField: {
    display: "grid",
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },
  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "12px",
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
    minHeight: 100,
  },
  submitBtn: {
    background: "#0b0b0b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    width: "fit-content",
    marginTop: 8,
  },
  linksContainer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  link: {
    color: "#0b5fff",
    textDecoration: "underline",
    fontSize: 14,
    cursor: "pointer",
  },
  separator: {
    color: "#d1d5db",
    fontSize: 14,
  },
  success: {
    background: "#e6ffed",
    color: "#056f00",
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: 14,
    marginTop: 8,
  },
  finalMessage: {
    background: "#e5e7eb",
    borderRadius: 10,
    padding: 20,
    textAlign: "center",
    fontSize: 14,
    color: "#374151",
    marginTop: 20,
  },
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    color: "#333",
    fontWeight: 600,
  },
};

