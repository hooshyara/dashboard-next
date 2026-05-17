'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PersianDatePicker } from '@/components/ui/persian-calendar';
import { LocationSelect } from '@/components/orders/location-select';
import { EmbeddedMapPicker } from '@/components/orders/embedded-map-picker';
import { Map } from 'lucide-react';
import {
  Order,
  Driver,
  OrderStatus,
  AssignType,
  Location,
  ORDER_STATUS_LABEL_FA,
} from '@/lib/types';

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  drivers: Driver[];
  locations: Location[];
  onSave: (order: Omit<Order, 'id' | 'trackingCode' | 'createdAt' | 'updatedAt'> | Order) => void | Promise<void>;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: OrderStatus.PENDING, label: ORDER_STATUS_LABEL_FA[OrderStatus.PENDING] },
  { value: OrderStatus.ASSIGNED, label: ORDER_STATUS_LABEL_FA[OrderStatus.ASSIGNED] },
  { value: OrderStatus.CANCEL, label: ORDER_STATUS_LABEL_FA[OrderStatus.CANCEL] },
];

const emptyForm = {
  pickupLocationId: null as number | null,
  pickupAddress: '',
  pickupLocationName: '',
  pickupLat: null as number | null,
  pickupLng: null as number | null,
  dropoffLocationId: null as number | null,
  dropoffAddress: '',
  dropoffLocationName: '',
  dropoffLat: null as number | null,
  dropoffLng: null as number | null,
  assignType: 'AI' as AssignType,
  contactPerson: '',
  deliveryTime: null as Date | null,
  description: '',
  status: OrderStatus.PENDING,
  mobile: '',
  returnTime: null as Date | null,
  productCode: '',
  driverId: null as number | null,
};

export function OrderFormDialog({
  open,
  onOpenChange,
  order,
  drivers,
  locations,
  onSave,
}: OrderFormDialogProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const isManualAssignment = formData.assignType === 'MANUAL';

  useEffect(() => {
    if (order) {
      const pickupLoc =
        order.pickupPlaceId != null
          ? locations.find((l) => l.id === order.pickupPlaceId)
          : null;
      const dropById =
        order.dropoffPlaceId != null
          ? locations.find((l) => l.id === order.dropoffPlaceId)
          : null;
      const legacyDrop =
        dropById ??
        locations.find(
          (loc) =>
            loc.title === order.locationName || loc.address === order.address
        );

      setFormData({
        pickupLocationId: pickupLoc?.id ?? null,
        pickupAddress: pickupLoc?.address ?? '',
        pickupLocationName: pickupLoc?.title ?? '',
        pickupLat: pickupLoc?.lat ?? null,
        pickupLng: pickupLoc?.lng ?? null,
        dropoffLocationId: legacyDrop?.id ?? null,
        dropoffAddress: order.address,
        dropoffLocationName: order.locationName || '',
        dropoffLat: order.lat ?? legacyDrop?.lat ?? null,
        dropoffLng: order.lng ?? legacyDrop?.lng ?? null,
        assignType: order.assignType,
        contactPerson: order.contactPerson,
        deliveryTime: new Date(order.deliveryTime),
        description: order.description || '',
        status: order.status,
        mobile: order.mobile || '',
        returnTime: order.returnTime ? new Date(order.returnTime) : null,
        productCode: order.productCode || '',
        driverId: order.driverId || null,
      });
    } else {
      setFormData({ ...emptyForm });
    }
  }, [order, open, locations]);

  const handlePickupChange = (location: Location | null) => {
    if (location) {
      setFormData((f) => ({
        ...f,
        pickupLocationId: location.id,
        pickupAddress: location.address,
        pickupLocationName: location.title,
        pickupLat: location.lat,
        pickupLng: location.lng,
      }));
    } else {
      setFormData((f) => ({
        ...f,
        pickupLocationId: null,
        pickupAddress: '',
        pickupLocationName: '',
        pickupLat: null,
        pickupLng: null,
      }));
    }
  };

  const handleDropoffChange = (location: Location | null) => {
    if (location) {
      setFormData((f) => ({
        ...f,
        dropoffLocationId: location.id,
        dropoffAddress: location.address,
        dropoffLocationName: location.title,
        dropoffLat: location.lat,
        dropoffLng: location.lng,
      }));
    } else {
      setFormData((f) => ({
        ...f,
        dropoffLocationId: null,
        dropoffAddress: '',
        dropoffLocationName: '',
        dropoffLat: null,
        dropoffLng: null,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.deliveryTime ||
      formData.pickupLocationId == null ||
      formData.dropoffLocationId == null
    ) {
      return;
    }
    if (formData.assignType === 'MANUAL' && !formData.driverId) return;

    const selectedDriver = formData.driverId
      ? drivers.find((d) => d.id === formData.driverId) || null
      : null;

    const orderData = {
      address: formData.dropoffAddress,
      assignType: formData.assignType,
      contactPerson: formData.contactPerson,
      deliveryTime: formData.deliveryTime,
      description: formData.description || null,
      status: formData.status,
      mobile: formData.mobile || null,
      locationName: formData.dropoffLocationName || null,
      returnTime: formData.returnTime || null,
      productCode: formData.productCode || null,
      lat: formData.dropoffLat,
      lng: formData.dropoffLng,
      pickupPlaceId: formData.pickupLocationId,
      dropoffPlaceId: formData.dropoffLocationId,
      driver: selectedDriver,
      driverId: formData.driverId,
    };

    setIsSaving(true);
    try {
      if (order) {
        await onSave({
          ...orderData,
          id: order.id,
          trackingCode: order.trackingCode,
          createdAt: order.createdAt,
          updatedAt: new Date(),
        });
      } else {
        await onSave(orderData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit =
    !!formData.deliveryTime &&
    formData.pickupLocationId != null &&
    formData.dropoffLocationId != null &&
    (!isManualAssignment || !!formData.driverId) &&
    !isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {order ? 'ویرایش سفارش' : 'افزودن سفارش جدید'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="text-sm font-medium text-foreground border-b border-border pb-2">
              فیلدهای ضروری
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pickup-location" className="text-foreground">
                آدرس مبدأ (pickupPlace) *
              </Label>
              <LocationSelect
                locations={locations}
                value={formData.pickupLocationId}
                onChange={handlePickupChange}
                placeholder="انتخاب مبدأ از لیست..."
              />
              {formData.pickupAddress && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.pickupAddress}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dropoff-location" className="text-foreground">
                آدرس مقصد *
              </Label>
              <LocationSelect
                locations={locations}
                value={formData.dropoffLocationId}
                onChange={handleDropoffChange}
                placeholder="انتخاب مقصد از لیست..."
              />
              {formData.dropoffAddress && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.dropoffAddress}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-foreground">زمان تحویل *</Label>
                <PersianDatePicker
                  value={formData.deliveryTime || undefined}
                  onChange={(date) =>
                    setFormData({ ...formData, deliveryTime: date || null })
                  }
                  placeholder="انتخاب تاریخ و ساعت"
                  showTimePicker
                />
                <Label className="text-foreground mt-2">زمان بازگشت</Label>
                <PersianDatePicker
                  value={formData.returnTime || undefined}
                  onChange={(date) =>
                    setFormData({ ...formData, returnTime: date || null })
                  }
                  placeholder="انتخاب تاریخ و ساعت"
                  showTimePicker
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPerson" className="text-foreground">
                  شخص تماس *
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="نام شخص تحویل گیرنده"
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="driver" className="text-foreground">
                  راننده{isManualAssignment ? ' *' : ''}
                </Label>
                <Select
                  value={formData.driverId?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      driverId: value === 'none' ? null : parseInt(value),
                    })
                  }
                  disabled={!isManualAssignment}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="انتخاب راننده" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none" className="text-foreground">
                      بدون راننده
                    </SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem
                        key={driver.id}
                        value={driver.id.toString()}
                        className="text-foreground"
                      >
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignType" className="text-foreground">
                  نوع تخصیص
                </Label>
                <Select
                  value={formData.assignType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      assignType: value as AssignType,
                      driverId: value === 'AI' ? null : formData.driverId,
                    })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="انتخاب نوع تخصیص" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="AI" className="text-foreground">
                      هوش مصنوعی (AI)
                    </SelectItem>
                    <SelectItem value="MANUAL" className="text-foreground">
                      دستی (Manual)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-foreground">
                  وضعیت
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as OrderStatus })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-foreground"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm font-medium text-foreground border-b border-border pb-2 mt-4">
              فیلدهای اختیاری
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mobile" className="text-foreground">
                  موبایل
                </Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  placeholder="شماره موبایل"
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productCode" className="text-foreground">
                  کد محصول
                </Label>
                <Input
                  id="productCode"
                  value={formData.productCode}
                  onChange={(e) =>
                    setFormData({ ...formData, productCode: e.target.value })
                  }
                  placeholder="کد محصول"
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-foreground">
                توضیحات
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="توضیحات سفارش"
                className="bg-secondary border-border text-foreground"
                rows={3}
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
              disabled={!canSubmit}
            >
              {isSaving ? 'در حال ذخیره...' : order ? 'ذخیره تغییرات' : 'افزودن'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
