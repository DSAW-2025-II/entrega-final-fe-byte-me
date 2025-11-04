const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://movetogether2-back.vercel.app";

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || error.message || "Request failed");
    }

    return response.json();
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

