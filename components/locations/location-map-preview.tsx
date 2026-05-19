'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getNeshanMapKey } from '@/lib/neshan-map-key';

import '@neshan-maps-platform/leaflet/dist/leaflet.css';

interface LocationMapPreviewProps {
  lat: number;
  lng: number;
  /** وقتی فرم باز است و مودال نقشه بسته است تا با Leaflet تداخل نکند */
  active: boolean;
}

export function LocationMapPreview({ lat, lng, active }: LocationMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{
    remove: () => void;
    setView: (c: [number, number], z: number, o?: { animate?: boolean }) => void;
    getZoom: () => number;
    invalidateSize: () => void;
    whenReady: (fn: () => void) => void;
  } | null>(null);
  const markerRef = useRef<{
    setLatLng: (ll: [number, number]) => void;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      setReady(false);
      setError(null);
      return;
    }

    const key = getNeshanMapKey();
    if (!key) {
      setError('برای پیش‌نمایش، NEXT_PUBLIC_NESHAN_MAP_API_KEY را تنظیم کنید.');
      return;
    }

    let cancelled = false;
    let ro: ResizeObserver | null = null;

    const initTimer = window.setTimeout(() => {
      (async () => {
        try {
          const L = (await import('@neshan-maps-platform/leaflet')).default;
          if (cancelled || !containerRef.current) return;

          const map = L.map(containerRef.current, {
            key,
            maptype: 'neshan',
            center: [lat, lng],
            zoom: 14,
            zoomControl: true,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
          });

          mapRef.current = map;
          const marker = L.marker([lat, lng], { draggable: false }).addTo(map);
          markerRef.current = marker;

          ro = new ResizeObserver(() => {
            map.invalidateSize();
          });
          ro.observe(containerRef.current);

          map.whenReady(() => {
            if (!cancelled) {
              setReady(true);
              setError(null);
              map.invalidateSize();
              requestAnimationFrame(() => map.invalidateSize());
              setTimeout(() => map.invalidateSize(), 200);
            }
          });
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'خطا در نقشه');
          }
        }
      })();
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      ro?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      setReady(false);
    };
  }, [active]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!active || !map || !marker || !ready) return;
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], map.getZoom(), { animate: false });
    map.invalidateSize();
  }, [lat, lng, active, ready]);

  if (!active) return null;

  return (
    <div className="grid gap-2">
      <p className="text-xs text-muted-foreground">پیش‌نمایش روی نقشهٔ نشان</p>
      <div className="relative h-44 w-full overflow-hidden rounded-lg border border-border bg-secondary">
        <div
          ref={containerRef}
          className="absolute inset-0 z-0 [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:z-0 [&_.leaflet-container]:font-sans"
        />
        {!ready && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/80">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-3 text-center text-xs text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
