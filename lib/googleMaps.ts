/**
 * Utilidad centralizada para cargar Google Maps API
 * Evita cargar el script múltiples veces
 */

declare global {
  interface Window {
    google: any;
    googleMapsLoading: Promise<void> | null;
  }
}

let loadingPromise: Promise<void> | null = null;

/**
 * Carga Google Maps API una sola vez
 */
export function loadGoogleMaps(): Promise<void> {
  // Si ya está cargada
  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve();
  }

  // Si ya hay una carga en progreso, devolver esa promesa
  if (typeof window !== "undefined" && window.googleMapsLoading) {
    return window.googleMapsLoading;
  }

  // Si no está en el cliente, devolver promesa resuelta
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("Google Maps API Key no configurada");
    return Promise.reject(new Error("Google Maps API Key no configurada"));
  }

  // Crear promesa de carga
  loadingPromise = new Promise((resolve, reject) => {
    // Verificar si ya está cargada
    if (window.google?.maps) {
      resolve();
      return;
    }

    // Verificar si el script ya existe en el DOM
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    if (existingScript) {
      // Si ya existe, esperar a que se cargue o verificar periódicamente
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout después de 10 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google?.maps) {
          resolve();
        } else {
          reject(new Error("Timeout esperando Google Maps"));
        }
      }, 10000);
      
      existingScript.addEventListener("load", () => {
        clearInterval(checkInterval);
        resolve();
      });
      existingScript.addEventListener("error", () => {
        clearInterval(checkInterval);
        reject(new Error("Error al cargar Google Maps API"));
      });
      return;
    }

    // Crear nuevo script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&language=es&region=CO`;
    script.async = true;
    script.defer = true;
    script.id = "google-maps-script";

    script.onload = () => {
      // Verificar que realmente se cargó
      if (window.google?.maps) {
        resolve();
      } else {
        // Esperar un poco más
        setTimeout(() => {
          if (window.google?.maps) {
            resolve();
          } else {
            reject(new Error("Google Maps no se inicializó correctamente"));
          }
        }, 500);
      }
    };

    script.onerror = () => {
      console.error("Error al cargar Google Maps API");
      reject(new Error("Error al cargar Google Maps API"));
    };

    document.head.appendChild(script);
  });

  // Guardar en window para compartir entre componentes
  if (typeof window !== "undefined") {
    window.googleMapsLoading = loadingPromise;
  }

  return loadingPromise;
}

/**
 * Verifica si Google Maps está cargado
 */
export function isGoogleMapsLoaded(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.google?.maps;
}

