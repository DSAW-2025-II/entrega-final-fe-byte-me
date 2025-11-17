/**
 * Utilidades para manejo de autenticación y tokens
 */

import { API_URL } from "./api";

const TOKEN_KEY = "idToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const TOKEN_EXPIRY_KEY = "tokenExpiry";

/**
 * Guarda el token y calcula su expiración
 */
export function saveToken(idToken: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(TOKEN_KEY, idToken);
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  
  // Decodificar el token para obtener la expiración
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convertir a milisegundos
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } catch (e) {
    // Si no se puede decodificar, asumir 1 hora de validez
    const expiryTime = Date.now() + 60 * 60 * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
}

/**
 * Obtiene el token actual
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Verifica si el token está expirado
 */
export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;
  
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return true;
  
  const expiryTime = parseInt(expiryStr, 10);
  const now = Date.now();
  
  // Considerar expirado si falta menos de 5 minutos
  return now >= (expiryTime - 5 * 60 * 1000);
}

/**
 * Verifica el token con el backend
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error("Error verificando token:", error);
    return false;
  }
}

/**
 * Intenta renovar el token usando Firebase Auth
 */
export async function refreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  
  try {
    const { auth, initializeFirebase } = await import("./firebase");
    const { onAuthStateChanged } = await import("firebase/auth");
    
    initializeFirebase();
    
    if (!auth) {
      return null;
    }
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        
        if (user) {
          try {
            const newToken = await user.getIdToken(true); // Forzar renovación
            saveToken(newToken);
            resolve(newToken);
          } catch (error) {
            console.error("Error renovando token:", error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
      
      // Timeout de 5 segundos
      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  } catch (error) {
    console.error("Error en refreshToken:", error);
    return null;
  }
}

/**
 * Verifica y renueva el token si es necesario
 */
export async function ensureValidToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  
  let token = getToken();
  
  if (!token) {
    // No hay token, intentar obtener de Firebase Auth
    token = await refreshToken();
    if (!token) {
      return null;
    }
  }
  
  // Verificar si está expirado
  if (isTokenExpired()) {
    console.log("Token expirado, intentando renovar...");
    const newToken = await refreshToken();
    if (newToken) {
      return newToken;
    }
    
    // Si no se pudo renovar, verificar el token actual de todas formas
    const isValid = await verifyToken(token);
    if (isValid) {
      // Actualizar la expiración
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      } catch (e) {
        // Ignorar error
      }
      return token;
    }
    
    return null;
  }
  
  // Verificar que el token sea válido
  const isValid = await verifyToken(token);
  if (!isValid) {
    // Intentar renovar
    const newToken = await refreshToken();
    return newToken;
  }
  
  return token;
}

/**
 * Limpia todos los tokens
 */
export function clearTokens() {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

