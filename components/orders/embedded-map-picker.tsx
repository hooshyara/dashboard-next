'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Locate, Loader2, X } from 'lucide-react';
import { DEFAULT_DRIVER_LAT, DEFAULT_DRIVER_LNG } from '@/lib/types';
import { getNeshanMapKey } from '@/lib/neshan-map-key';

import '@neshan-maps-platform/leaflet/dist/leaflet.css';

interface EmbeddedMapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onSelect: (lat: number, lng: number) => void;
  onCancel: () => void;
}

export function EmbeddedMapPicker({
  lat,
  lng,
  onSelect,
  onCancel,
}: EmbeddedMapPickerProps) {
  const [selectedLat, setSelectedLat] = useState(lat || DEFAULT_DRIVER_LAT);
  const [selectedLng, setSelectedLng] = useState(lng || DEFAULT_DRIVER_LNG);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{
    remove: () => void;
    whenReady: (fn: () => void) => void;
    invalidateSize: () => void;
    setView: (center: [number, number], zoom: number) => void;
    on: (ev: string, fn: (e: { latlng: { lat: number; lng: number } }) => void) => void;
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
    setSelectedLat(lat ?? DEFAULT_DRIVER_LAT);
    setSelectedLng(lng ?? DEFAULT_DRIVER_LNG);
    setMapError(null);
    setMapReady(false);
  }, [lat, lng]);

  useEffect(() => {
    const apiKey = getNeshanMapKey();
    if (!apiKey) {
      setMapError(
        'کلید نقشه وب نشان تنظیم نشده. متغیر NEXT_PUBLIC_NESHAN_MAP_API_KEY را در .env.local قرار دهید.'
      );
      return;
    }

    let cancelled = false;
    let ro: ResizeObserver | null = null;

    const initTimer = window.setTimeout(() => {
      (async () => {
        try {
          const L = (await import('@neshan-maps-platform/leaflet')).default;

          if (cancelled || !containerRef.current) return;

          const initLat = lat ?? DEFAULT_DRIVER_LAT;
          const initLng = lng ?? DEFAULT_DRIVER_LNG;

          const map = L.map(containerRef.current, {
            key: apiKey,
            maptype: 'neshan',
            center: [initLat, initLng],
            zoom: 14,
          });

          mapRef.current = map;

          const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);
          markerRef.current = marker;

          const syncFromMarker = () => {
            const ll = marker.getLatLng();
            setSelectedLat(ll.lat);
            setSelectedLng(ll.lng);
          };

          marker.on('dragend', syncFromMarker);

          map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
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
              e instanceof Error ? e.message : 'بارگذاری نقشه نشان با خطا مواجه شد.'
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
  }, [lat, lng]);

  const handleConfirm = () => {
    onSelect(selectedLat, selectedLng);
  };

  const handleReset = () => {
    const resetLat = DEFAULT_DRIVER_LAT;
    const resetLng = DEFAULT_DRIVER_LNG;
    setSelectedLat(resetLat);
    setSelectedLng(resetLng);
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      marker.setLatLng([resetLat, resetLng]);
      map.setView([resetLat, resetLng], 14);
      map.invalidateSize();
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-secondary/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">انتخاب موقعیت از روی نقشه</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-7 w-7  hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative h-[250px] w-full rounded-lg border border-border bg-secondary overflow-hidden">
        {!mapError && (
          <div
            ref={containerRef}
            className="absolute inset-0 z-0 [&_.leaflet-container]:isolate [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-sans"
          />
        )}
        {!mapReady && !mapError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/80">
            <Loader2 className="h-6 w-6 animate-spin " />
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 text-center text-xs text-destructive">
            {mapError}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 ">
          <span>عرض: <span className="font-mono text-foreground">{selectedLat.toFixed(6)}</span></span>
          <span>طول: <span className="font-mono text-foreground">{selectedLng.toFixed(6)}</span></span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleReset}
          disabled={!mapReady && !mapError}
          className="h-7 text-xs"
        >
          <Locate className="h-3 w-3 ml-1" />
          بازنشانی
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-border"
        >
          انصراف
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          className="bg-primary text-primary-foreground"
          disabled={!!mapError || !mapReady}
        >
          <MapPin className="h-3 w-3 ml-1" />
          تایید موقعیت
        </Button>
      </div>
    </div>
  );
}
