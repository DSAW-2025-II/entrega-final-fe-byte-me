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

export const API_URL = getApiUrl();

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
      // Asegurar headers correctos - mergear correctamente
      const headers = new Headers(options.headers as HeadersInit);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const maybeAuth = (options.headers as Record<string, string> | undefined)?.Authorization;
      if (maybeAuth) {
        headers.set("Authorization", maybeAuth);
      }
      
      const fetchOptions: RequestInit = {
        method: options.method || "GET",
        headers,
        mode: "cors",
        credentials: "include", // Para cookies si las usas, no molesta si usas JWT
      };
      
      // Solo agregar body si existe y no es GET
      if (options.body && options.method !== "GET") {
        fetchOptions.body = options.body;
      }
      
      // No sobrescribir mode y credentials si ya están en options
      // pero asegurarse de que siempre estén configurados
      if (options.mode) {
        fetchOptions.mode = options.mode;
      }
      if (options.credentials !== undefined) {
        fetchOptions.credentials = options.credentials;
      }
      
      console.log("🔍 Fetch options:", {
        method: fetchOptions.method,
        url,
        hasAuth: headers.has("Authorization"),
        hasBody: !!fetchOptions.body,
        bodyLength: fetchOptions.body ? String(fetchOptions.body).length : 0,
      });
      
      const response = await fetch(url, fetchOptions);

      console.log("📥 API Response:", {
        status: response.status,
        statusText: response.statusText,
        url,
        ok: response.ok,
      });

      if (!response.ok) {
        // Intentar leer JSON, si viene vacío, leer texto para depurar bien
        let payload: any = null;
        const text = await response.text();
        try {
          payload = text ? JSON.parse(text) : null;
        } catch {
          payload = { raw: text };
        }
        
        const errorMessage = (payload && (payload.error || payload.message)) || `HTTP ${response.status}`;
        console.error("✘ API Error:", errorMessage, "URL:", url, "Response:", payload ?? text);
        throw new Error(errorMessage);
      }

      // Misma lógica para parsear respuesta exitosa
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      console.log("✅ API Success:", { url, dataKeys: data ? Object.keys(data) : [] });
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

  async delete(endpoint: string, data?: any, token?: string) {
    return this.request(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

export default api;

