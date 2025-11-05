"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: { address: string; lat: number; lng: number }) => void;
  onSelectFromMap?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  onSelectFromMap,
  placeholder = "Buscar lugar...",
  disabled = false,
}: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    // Cargar Google Maps API usando el loader centralizado
    if (typeof window === "undefined") return;
    
    loadGoogleMaps()
      .then(() => {
        if (window.google?.maps?.places) {
          setGoogleReady(true);
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
      })
      .catch((error: any) => {
        console.error("Error cargando Google Maps:", error);
      });
  }, []);

  // Cerrar sugerencias cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getSuggestions = useCallback(
    (input: string) => {
      if (!autocompleteServiceRef.current || !input.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: input,
          componentRestrictions: { country: "co" },
          types: ["establishment", "geocode"],
        },
        (predictions: any[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    },
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    getSuggestions(newValue);
  };

  const handlePlaceSelect = useCallback(
    async (place: any) => {
      if (!place.place_id || !window.google?.maps) return;

      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      service.getDetails(
        {
          placeId: place.place_id,
          fields: ["formatted_address", "geometry", "name"],
        },
        (placeDetails: any, status: string) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            placeDetails?.geometry?.location
          ) {
            const address =
              placeDetails.formatted_address || placeDetails.name || value;
            const lat = placeDetails.geometry.location.lat();
            const lng = placeDetails.geometry.location.lng();

            onChange(address);
            onSelect({
              address,
              lat,
              lng,
            });
            setShowSuggestions(false);
            setSuggestions([]);
          }
        }
      );
    },
    [value, onChange, onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && onSelectFromMap) {
        onSelectFromMap();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handlePlaceSelect(suggestions[selectedIndex]);
      } else if (onSelectFromMap) {
        onSelectFromMap();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.trim()) {
            getSuggestions(value);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || !googleReady}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 6,
          border: "1px solid #ddd",
          background: disabled ? "#f5f5f5" : "#fff",
          padding: "0 14px",
          fontSize: 14,
          outline: "none",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxHeight: 300,
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              onClick={() => handlePlaceSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                backgroundColor:
                  selectedIndex === index ? "#f5f5f5" : "transparent",
                borderBottom:
                  index < suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#333",
                  marginBottom: 4,
                }}
              >
                {suggestion.structured_formatting.main_text}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                }}
              >
                {suggestion.structured_formatting.secondary_text}
              </div>
            </div>
          ))}
          {onSelectFromMap && (
            <div
              onClick={() => {
                onSelectFromMap();
                setShowSuggestions(false);
              }}
              onMouseEnter={() => setSelectedIndex(suggestions.length)}
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                backgroundColor:
                  selectedIndex === suggestions.length ? "#f5f5f5" : "transparent",
                borderTop: "2px solid #e0e0e0",
                fontWeight: 500,
                color: "#0b1b27",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>🗺️</span>
              <span>Seleccionar desde el mapa</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
