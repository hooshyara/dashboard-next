'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContentCentered,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MapPin, Locate, Loader2 } from 'lucide-react';
import { DEFAULT_DRIVER_LAT, DEFAULT_DRIVER_LNG } from '@/lib/types';
import { getNeshanMapKey } from '@/lib/neshan-map-key';

import '@neshan-maps-platform/leaflet/dist/leaflet.css';

interface MapPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number;
  initialLng?: number;
  onSelect: (lat: number, lng: number) => void;
}

export function MapPickerModal({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  onSelect,
}: MapPickerModalProps) {
  const [selectedLat, setSelectedLat] = useState(initialLat || DEFAULT_DRIVER_LAT);
  const [selectedLng, setSelectedLng] = useState(initialLng || DEFAULT_DRIVER_LNG);
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
    if (open) {
      setSelectedLat(initialLat ?? DEFAULT_DRIVER_LAT);
      setSelectedLng(initialLng ?? DEFAULT_DRIVER_LNG);
      setMapError(null);
      setMapReady(false);
    }
  }, [open, initialLat, initialLng]);

  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      setMapReady(false);
      return;
    }

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

          const lat = initialLat ?? DEFAULT_DRIVER_LAT;
          const lng = initialLng ?? DEFAULT_DRIVER_LNG;

          const map = L.map(containerRef.current, {
            key: apiKey,
            maptype: 'neshan',
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
  }, [open, initialLat, initialLng]);

  const handleConfirm = () => {
    onSelect(selectedLat, selectedLng);
    // Only close the map picker modal, not the parent
    onOpenChange(false);
  };

  const handleReset = () => {
    const lat = DEFAULT_DRIVER_LAT;
    const lng = DEFAULT_DRIVER_LNG;
    setSelectedLat(lat);
    setSelectedLng(lng);
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 14);
      map.invalidateSize();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentCentered
        overlayClassName="z-[100]"
        panelClassName="max-h-[min(90vh,860px)] overflow-y-auto sm:max-w-[700px]"
        className="pointer-events-none z-[100] [&>div]:pointer-events-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">انتخاب موقعیت از روی نقشه</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="relative h-[min(55vh,420px)] min-h-[320px] w-full rounded-lg border border-border bg-secondary">
            {!mapError && (
              <div
                ref={containerRef}
                className="absolute inset-0 z-0 [&_.leaflet-container]:isolate [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-sans"
              />
            )}
            {!mapReady && !mapError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/80">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-4 text-center text-sm text-destructive">
                {mapError}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-secondary p-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">عرض جغرافیایی: </span>
                <span className="font-mono text-foreground">{selectedLat.toFixed(6)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">طول جغرافیایی: </span>
                <span className="font-mono text-foreground">{selectedLng.toFixed(6)}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleReset}
              disabled={!mapReady && !mapError}
              className="shrink-0 border-border"
            >
              <Locate className="h-4 w-4 ml-2" />
              بازنشانی
            </Button>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            روی نقشه کلیک کنید یا نشانگر را بکشید. اگر کاشی‌ها خالی بودند، کلید «نقشه وب» را در پنل نشان
            بررسی کنید.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-primary text-primary-foreground"
            disabled={!!mapError || !mapReady}
          >
            <MapPin className="h-4 w-4 ml-2" />
            تایید موقعیت
          </Button>
        </DialogFooter>
      </DialogContentCentered>
    </Dialog>
  );
}
