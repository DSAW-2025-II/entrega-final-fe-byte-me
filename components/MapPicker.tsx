"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

interface MapPickerProps {
  onPlaceSelect: (place: { address: string; lat: number; lng: number }) => void;
  mode: "from" | "to";
  fromCoord?: { lat: number; lng: number } | null;
  toCoord?: { lat: number; lng: number } | null;
  height?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function MapPicker({
  onPlaceSelect,
  mode,
  fromCoord,
  toCoord,
  height = "100%",
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ from?: any; to?: any }>({});
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);
  const modeRef = useRef<"from" | "to">(mode);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const [googleReady, setGoogleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Actualizar refs cuando cambian los props
  useEffect(() => {
    modeRef.current = mode;
    onPlaceSelectRef.current = onPlaceSelect;
  }, [mode, onPlaceSelect]);

  useEffect(() => {
    // Cargar Google Maps API usando el loader centralizado
    if (typeof window === "undefined") return;
    
    console.log("🗺️ Iniciando carga de Google Maps...");
    console.log("📍 Elemento del mapa existe:", !!mapRef.current);
    
    loadGoogleMaps()
      .then(() => {
        console.log("✅ Google Maps API cargada");
        if (window.google?.maps) {
          console.log("✅ Google Maps disponible");
          // Pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            setGoogleReady(true);
            console.log("✅ Estado googleReady actualizado a true");
          }, 100);
        } else {
          console.error("❌ Google Maps no disponible después de cargar");
          setIsLoading(false);
        }
      })
      .catch((error: any) => {
        console.error("❌ Error cargando Google Maps:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!googleReady) {
      console.log("⏳ Esperando Google Maps... googleReady:", googleReady);
      return;
    }
    
    if (!window.google?.maps) {
      console.error("❌ Google Maps no está disponible");
      setIsLoading(false);
      return;
    }
    
    // Si el mapa ya está inicializado, no hacer nada
    if (mapInstanceRef.current) {
      console.log("✅ Mapa ya está inicializado");
      return;
    }
    
    // Esperar a que el elemento del mapa esté disponible
    if (!mapRef.current) {
      console.log("⏳ Esperando elemento del mapa...");
      const checkInterval = setInterval(() => {
        if (mapRef.current && window.google?.maps) {
          console.log("✅ Elemento del mapa encontrado");
          clearInterval(checkInterval);
          initializeMap();
        }
      }, 50);
      
      // Timeout después de 2 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!mapRef.current) {
          console.error("❌ Timeout esperando elemento del mapa");
          setIsLoading(false);
        }
      }, 2000);
      
      return () => clearInterval(checkInterval);
    }
    
    initializeMap();
    
    function initializeMap() {
      if (!googleReady || !mapRef.current || !window.google?.maps) {
        return;
      }

      try {
        console.log("🗺️ Inicializando mapa en el elemento:", mapRef.current);

        // Inicializar mapa centrado en Bogotá, Colombia
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 4.6097, lng: -74.0817 }, // Bogotá
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        setIsLoading(false);
        
        console.log("✅ Mapa inicializado correctamente");

        // Inicializar DirectionsService y DirectionsRenderer
        if (window.google.maps.DirectionsService && window.google.maps.DirectionsRenderer) {
          directionsServiceRef.current = new window.google.maps.DirectionsService();
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true, // No mostrar marcadores automáticos, usaremos los nuestros
            polylineOptions: {
              strokeColor: "#4285F4",
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          });
          console.log("✅ DirectionsService y DirectionsRenderer inicializados");
        } else {
          console.error("❌ DirectionsService o DirectionsRenderer no disponibles");
        }

        // Geocoder para obtener dirección desde coordenadas
        const geocoder = new window.google.maps.Geocoder();

        // Remover listener anterior si existe
        if (clickListenerRef.current) {
          window.google.maps.event.removeListener(clickListenerRef.current);
        }

        // Listener para clicks en el mapa (usa refs para obtener valores actuales)
        clickListenerRef.current = map.addListener("click", (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const currentMode = modeRef.current;
          const currentOnPlaceSelect = onPlaceSelectRef.current;

          // Obtener dirección desde coordenadas
          geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
            if (status === "OK" && results[0]) {
              const address = results[0].formatted_address;

              // Actualizar marcador según el modo actual
              if (markersRef.current[currentMode]) {
                markersRef.current[currentMode].setMap(null);
              }

              const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                title: currentMode === "from" ? "Punto de partida" : "Destino",
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: currentMode === "from" ? "#4285F4" : "#EA4335",
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                },
              });

              markersRef.current[currentMode] = marker;

              // Llamar al callback actual
              currentOnPlaceSelect({
                address,
                lat,
                lng,
              });
            }
          });
        });
      } catch (error) {
        console.error("❌ Error inicializando mapa:", error);
        setIsLoading(false);
        setGoogleReady(false);
      }
    }
  }, [googleReady]);

  // Actualizar marcadores y calcular ruta cuando cambian las coordenadas
  useEffect(() => {
    if (!mapInstanceRef.current || !googleReady) return;

    const updateMarker = (
      coord: { lat: number; lng: number } | null | undefined,
      key: "from" | "to",
      color: string
    ) => {
      if (markersRef.current[key]) {
        markersRef.current[key].setMap(null);
        delete markersRef.current[key];
      }

      if (coord) {
        const marker = new window.google.maps.Marker({
          position: coord,
          map: mapInstanceRef.current,
          title: key === "from" ? "Punto de partida" : "Destino",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });

        markersRef.current[key] = marker;

        // Centrar mapa en el marcador solo si no hay ruta
        if (mode === key && !fromCoord && !toCoord) {
          mapInstanceRef.current.setCenter(coord);
        }
      }
    };

    updateMarker(fromCoord, "from", "#4285F4");
    updateMarker(toCoord, "to", "#EA4335");

    // Calcular y mostrar ruta si ambos puntos están seleccionados
    if (fromCoord && toCoord) {
      console.log("🗺️ Ambos puntos seleccionados:", { fromCoord, toCoord });
      
      if (!directionsServiceRef.current || !directionsRendererRef.current) {
        console.warn("⚠️ DirectionsService o DirectionsRenderer no están inicializados");
        return;
      }
      
      console.log("🗺️ Calculando ruta desde:", fromCoord, "hasta:", toCoord);
      
      // Limpiar ruta anterior antes de calcular nueva
      directionsRendererRef.current.setDirections({ routes: [] });
      
      directionsServiceRef.current.route(
        {
          origin: fromCoord,
          destination: toCoord,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result: any, status: string) => {
          console.log("📊 Estado de la ruta:", status);
          
          if (status === window.google.maps.DirectionsStatus.OK) {
            console.log("✅ Ruta calculada correctamente");
            console.log("📏 Distancia:", result.routes[0]?.legs[0]?.distance?.text);
            console.log("⏱️ Duración:", result.routes[0]?.legs[0]?.duration?.text);
            
            // Mostrar la ruta en el mapa
            directionsRendererRef.current.setDirections(result);
            
            // Ajustar el mapa para mostrar toda la ruta usando los bounds de la ruta
            if (result.routes && result.routes[0] && result.routes[0].bounds) {
              mapInstanceRef.current.fitBounds(result.routes[0].bounds, {
                padding: { top: 50, right: 50, bottom: 50, left: 50 }
              });
            } else {
              // Fallback: usar los puntos de origen y destino
              const bounds = new window.google.maps.LatLngBounds();
              bounds.extend(fromCoord);
              bounds.extend(toCoord);
              mapInstanceRef.current.fitBounds(bounds, {
                padding: { top: 50, right: 50, bottom: 50, left: 50 }
              });
            }
          } else {
            console.error("❌ Error calculando ruta:", status);
            console.error("Detalles:", {
              status,
              fromCoord,
              toCoord,
              hasDirectionsService: !!directionsServiceRef.current,
              hasDirectionsRenderer: !!directionsRendererRef.current,
            });
          }
        }
      );
    } else {
      // Limpiar ruta si no hay ambos puntos
      if (directionsRendererRef.current) {
        console.log("🧹 Limpiando ruta (faltan puntos)");
        directionsRendererRef.current.setDirections({ routes: [] });
      }
      
      // Si solo hay un punto, centrar en ese punto
      if (fromCoord && !toCoord) {
        mapInstanceRef.current.setCenter(fromCoord);
        mapInstanceRef.current.setZoom(14);
      } else if (toCoord && !fromCoord) {
        mapInstanceRef.current.setCenter(toCoord);
        mapInstanceRef.current.setZoom(14);
      } else if (!fromCoord && !toCoord) {
        // Si no hay puntos, volver a Bogotá
        mapInstanceRef.current.setCenter({ lat: 4.6097, lng: -74.0817 });
        mapInstanceRef.current.setZoom(12);
      }
    }
  }, [fromCoord, toCoord, googleReady, mode]);

  if (isLoading) {
    return (
      <div
        style={{
          width: "100%",
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          borderRadius: 12,
          color: "#666",
        }}
      >
        <div>Cargando mapa...</div>
      </div>
    );
  }

  if (!googleReady) {
    return (
      <div
        style={{
          width: "100%",
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          borderRadius: 12,
          color: "#666",
          padding: 20,
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 10 }}>⚠️ Error al cargar Google Maps</div>
        <div style={{ fontSize: 12, color: "#999" }}>
          Verifica:
          <br />- API Key configurada
          <br />- APIs habilitadas en Google Cloud
          <br />- Restricciones de HTTP referrers
        </div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 10 }}>
          Abre la consola (F12) para más detalles
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        minHeight: height,
        backgroundColor: "#e5e5e5",
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: height,
          display: "block",
        }}
      />
    </div>
  );
}

