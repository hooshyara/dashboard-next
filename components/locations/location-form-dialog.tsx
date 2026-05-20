"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContentCentered,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2 } from "lucide-react";
import { Location, DEFAULT_DRIVER_LAT, DEFAULT_DRIVER_LNG } from "@/lib/types";
import { MapPickerModal, MapPickerModalRef } from "./map-picker-modal";
import Cookies from "js-cookie";
import { getNeshanMapKey } from "@/lib/neshan-map-key";

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
  onSave: (
    location: Omit<Location, "id" | "createdAt" | "updatedAt"> | Location,
  ) => void;
}

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  onSave,
}: LocationFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    lat: DEFAULT_DRIVER_LAT,
    lng: DEFAULT_DRIVER_LNG,
    description: "",
  });
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapPickerRef = useRef<MapPickerModalRef | null>(null);
  const userId = Number(Cookies.get("userId") ?? 0);

  // Geocode address using Neshan API
  const geocodeAddress = useCallback(async (address: string) => {
    if (!address || address.trim().length < 3) return;
    
    const apiKey = getNeshanMapKey();
    if (!apiKey) return;

    setIsSearching(true);
    try {
      // Use Neshan Search API to find address
      const response = await fetch(
        `https://api.neshan.org/v1/search?term=${encodeURIComponent(address)}&lat=${DEFAULT_DRIVER_LAT}&lng=${DEFAULT_DRIVER_LNG}`,
        {
          headers: {
            'Api-Key': apiKey,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const firstResult = data.items[0];
        const newLat = firstResult.location?.y || firstResult.location?.lat;
        const newLng = firstResult.location?.x || firstResult.location?.lng;
        
        if (newLat && newLng) {
          setFormData((prev) => ({ ...prev, lat: newLat, lng: newLng }));
          // Update the map marker position
          mapPickerRef.current?.updateMarker(newLat, newLng);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle address change with debouncing
  const handleAddressChange = useCallback((newAddress: string) => {
    setFormData((prev) => ({ ...prev, address: newAddress }));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced geocoding
    searchTimeoutRef.current = setTimeout(() => {
      geocodeAddress(newAddress);
    }, 500); // 500ms debounce
  }, [geocodeAddress]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        description: location.description || "",
      });
    } else {
      setFormData({
        name: "",
        address: "",
        lat: DEFAULT_DRIVER_LAT,
        lng: DEFAULT_DRIVER_LNG,
        description: "",
      });
    }
  }, [location, open]);

  const handleMapPickerConfirm = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const locationData = {
      name: formData.name,
      title: formData.name, // Alias for UI components
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
      description: formData.description || null,
      userId
    };

    if (location) {
      onSave({
        ...locationData,
        id: location.id,
        createdAt: location.createdAt,
        updatedAt: new Date(),
        userId,
      });
    } else {
      onSave(locationData);
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal={!mapPickerOpen}>
        <DialogContentCentered
          panelClassName="sm:max-w-[500px] bg-card border-border"
          className="pointer-events-none [&>div]:pointer-events-auto overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {location ? "ویرایش آدرس" : "افزودن آدرس جدید"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-foreground">
                  نام مقصد *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="مثلا: دفتر مرکزی"
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="address" className="text-foreground">
                    آدرس کامل *
                  </Label>
                  {isSearching && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="آدرس کامل با جزئیات - نقشه به صورت خودکار به‌روزرسانی می‌شود"
                  className="bg-secondary border-border text-foreground"
                  rows={2}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-foreground">موقعیت روی نقشه</Label>

                <MapPickerModal
                  ref={mapPickerRef}
                  initialLat={formData.lat}
                  initialLng={formData.lng}
                  onSelect={handleMapPickerConfirm}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-foreground">
                  توضیحات{" "}
                  <span className="text-muted-foreground text-xs">
                    (اختیاری)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="توضیحات اضافی مانند طبقه، واحد، نشانی..."
                  className="bg-secondary border-border text-foreground"
                  rows={2}
                />
              </div>
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
                type="submit"
                className="bg-primary text-primary-foreground"
              >
                <MapPin className="h-4 w-4 ml-2" />
                {location ? "ذخیره تغییرات" : "افزودن"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContentCentered>
      </Dialog>
    </>
  );
}
