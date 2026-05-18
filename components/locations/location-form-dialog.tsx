'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContentCentered,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Map } from 'lucide-react';
import { Location, DEFAULT_DRIVER_LAT, DEFAULT_DRIVER_LNG } from '@/lib/types';
import { MapPickerModal } from './map-picker-modal';
import { LocationMapPreview } from './location-map-preview';

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
  onSave: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> | Location) => void;
}

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  onSave,
}: LocationFormDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    lat: DEFAULT_DRIVER_LAT,
    lng: DEFAULT_DRIVER_LNG,
    description: '',
  });
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  useEffect(() => {
    if (location) {
      setFormData({
        title: location.title,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        description: location.description || '',
      });
    } else {
      setFormData({
        title: '',
        address: '',
        lat: DEFAULT_DRIVER_LAT,
        lng: DEFAULT_DRIVER_LNG,
        description: '',
      });
    }
  }, [location, open]);

  const handleMapPickerConfirm = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
    // setMapPickerOpen(false) is now handled inside MapPickerModal
  };

  const handleMapPickerOpenChange = (open: boolean) => {
    setMapPickerOpen(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const locationData = {
      title: formData.title,
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
      description: formData.description || null,
    };

    if (location) {
      onSave({
        ...locationData,
        id: location.id,
        createdAt: location.createdAt,
        updatedAt: new Date(),
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
              {location ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-foreground">نام مقصد *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثلا: دفتر مرکزی"
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address" className="text-foreground">آدرس کامل *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="آدرس کامل با جزئیات"
                  className="bg-secondary border-border text-foreground"
                  rows={2}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-foreground">موقعیت روی نقشه</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMapPickerOpen(true)}
                  className="w-full border-border"
                >
                  <Map className="h-4 w-4 ml-2" />
                  انتخاب نقطه از روی نقشه
                </Button>

                <LocationMapPreview
                  lat={formData.lat}
                  lng={formData.lng}
                  active={open && !mapPickerOpen}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-foreground">
                  توضیحات <span className="text-muted-foreground text-xs">(اختیاری)</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              <Button type="submit" className="bg-primary text-primary-foreground">
                <MapPin className="h-4 w-4 ml-2" />
                {location ? 'ذخیره تغییرات' : 'افزودن'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContentCentered>
      </Dialog>

      <MapPickerModal
        open={mapPickerOpen}
        onOpenChange={handleMapPickerOpenChange}
        initialLat={formData.lat}
        initialLng={formData.lng}
        onSelect={handleMapPickerConfirm}
      />
    </>
  );
}
