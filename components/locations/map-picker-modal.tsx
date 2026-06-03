"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContentCentered,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Locate, Loader2 } from "lucide-react";
import { DEFAULT_DRIVER_LAT, DEFAULT_DRIVER_LNG } from "@/lib/types";
import { getNeshanMapKey } from "@/lib/neshan-map-key";

import "@neshan-maps-platform/leaflet/dist/leaflet.css";

export interface MapPickerModalRef {
  updateMarker: (lat: number, lng: number) => void;
}

interface MapPickerModalProps {
  initialLat?: number;
  initialLng?: number;
  onSelect: (lat: number, lng: number) => void;
}

export const MapPickerModal = forwardRef<MapPickerModalRef, MapPickerModalProps>(function MapPickerModal({
  initialLat,
  initialLng,
  onSelect,
}, ref) {
  const [selectedLat, setSelectedLat] = useState(DEFAULT_DRIVER_LAT);
  const [selectedLng, setSelectedLng] = useState(DEFAULT_DRIVER_LNG);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{
    remove: () => void;
    whenReady: (fn: () => void) => void;
    invalidateSize: () => void;
    setView: (center: [number, number], zoom: number) => void;
    on: (
      ev: string,
      fn: (e: { latlng: { lat: number; lng: number } }) => void,
    ) => void;
  } | null>(null);
  const markerRef = useRef<{
    setLatLng: (ll: [number, number] | { lat: number; lng: number }) => void;
    getLatLng: () => { lat: number; lng: number };
    on: (ev: string, fn: () => void) => void;
    addTo: (map: unknown) => unknown;
  } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    initialLat && setSelectedLat(initialLat);
    initialLng && setSelectedLng(initialLng);
    setMapError(null);
    setMapReady(false);
  }, []);

  // Expose updateMarker method to parent via ref
  useImperativeHandle(ref, () => ({
    updateMarker: (lat: number, lng: number) => {
      if (markerRef.current && mapRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], 14);
        setSelectedLat(lat);
        setSelectedLng(lng);
        onSelect(lat, lng);
      }
    }
  }), [onSelect]);

  useEffect(() => {
    const apiKey = getNeshanMapKey();
    if (!apiKey) {
      setMapError(
        "کلید نقشه وب نشان تنظیم نشده. متغیر NEXT_PUBLIC_NESHAN_MAP_API_KEY را در .env.local قرار دهید.",
      );
      return;
    }

    let cancelled = false;
    let ro: ResizeObserver | null = null;

    const initTimer = window.setTimeout(() => {
      (async () => {
        try {
          const L = (await import("@neshan-maps-platform/leaflet")).default;

          if (cancelled || !containerRef.current) return;

          const lat = initialLat ?? DEFAULT_DRIVER_LAT;
          const lng = initialLng ?? DEFAULT_DRIVER_LNG;

          const map = L.map(containerRef.current, {
            key: apiKey,
            maptype: "neshan",
            center: [lat, lng],
            zoom: 14,
          });

          mapRef.current = map;

          const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current = marker;

          const syncFromMarker = () => {
            const ll = marker.getLatLng();
            setSelectedLat(ll.lat);
            setSelectedLng(ll.lng);
            onSelect(ll.lat, ll.lng);
          };

          marker.on("dragend", syncFromMarker);

          map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
            marker.setLatLng(e.latlng);
            syncFromMarker();
          });

          syncFromMarker();

          ro = new ResizeObserver(() => {
            map.invalidateSize();
          });
          ro.observe(containerRef.current);

          map.whenReady(() => {
            if (!cancelled) {
              setMapReady(true);
              requestAnimationFrame(() => {
                map.invalidateSize();
                setTimeout(() => map.invalidateSize(), 100);
                setTimeout(() => map.invalidateSize(), 400);
              });
            }
          });
        } catch (e) {
          if (!cancelled) {
            setMapError(
              e instanceof Error
                ? e.message
                : "بارگذاری نقشه نشان با خطا مواجه شد.",
            );
          }
        }
      })();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      ro?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open]);

  return (
    <div className="relative h-[min(55vh,420px)] min-h-[320px] w-full rounded-lg border border-border bg-secondary">
      {!mapError && (
        <div
          ref={containerRef}
          className="absolute inset-0 z-0 [&_.leaflet-container]:isolate [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-sans"
        />
      )}
      {!mapReady && !mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/80">
          <Loader2 className="h-8 w-8 animate-spin " />
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 text-center text-sm text-destructive">
          {mapError}
        </div>
      )}
    </div>
  );
});
