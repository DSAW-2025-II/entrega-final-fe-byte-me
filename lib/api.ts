const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMessage = error.error || error.message || `Request failed with status ${response.status}`;
        console.error("API Error:", errorMessage, "URL:", url);
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      console.error("Fetch Error:", error, "URL:", url);
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

