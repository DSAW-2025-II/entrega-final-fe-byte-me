// Determinar la URL del API: priorizar variable de entorno, luego localhost para desarrollo, luego producción
const getApiUrl = () => {
  // Si hay variable de entorno, usarla
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Si estamos en el navegador, verificar si es localhost
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3001";
    }
  }

  // Por defecto, usar producción
  return "https://movetogether2-back.vercel.app";
};

const API_URL = getApiUrl();

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    // Asegurar que el endpoint comience con /
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${normalizedEndpoint}`;
    
    console.log("🚀 API Request:", {
      method: options.method || "GET",
      url,
      endpoint: normalizedEndpoint,
      hasToken: !!(options.headers as any)?.Authorization,
    });
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      console.log("📥 API Response:", {
        status: response.status,
        statusText: response.statusText,
        url,
        ok: response.ok,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMessage = error.error || error.message || `Request failed with status ${response.status}`;
        console.error("❌ API Error:", errorMessage, "URL:", url, "Response:", error);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ API Success:", { url, dataKeys: Object.keys(data) });
      return data;
    } catch (error: any) {
      console.error("💥 Fetch Error:", {
        message: error.message,
        name: error.name,
        url,
        stack: error.stack,
      });
      
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
        const errorMessage = isLocalhost
          ? `No se pudo conectar al servidor en ${url}. Verifica que el servidor backend esté ejecutándose en localhost:3001 (ejecuta 'npm run dev' en MoveTogether2-back) o configura NEXT_PUBLIC_API_URL.`
          : `No se pudo conectar al servidor en ${url}. Verifica tu conexión a internet o que el servidor esté en ejecución.`;
        throw new Error(errorMessage);
      }
      
      if (error.message) {
        throw error;
      }
      throw new Error(`Error de conexión: ${error.message || "No se pudo conectar al servidor"}`);
    }
  },

  async get(endpoint: string, token?: string) {
    return this.request(endpoint, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async post(endpoint: string, data?: any, token?: string) {
    return this.request(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

export default api;

