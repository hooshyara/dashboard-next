"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PersianDatePicker } from "@/components/ui/persian-calendar";
import { LocationSelect } from "@/components/orders/location-select";
import { EmbeddedMapPicker } from "@/components/orders/embedded-map-picker";
import { LocationFormDialog } from "@/components/locations/location-form-dialog";
import { Map, Plus } from "lucide-react";
import {
  Order,
  Driver,
  OrderStatus,
  AssignType,
  Location,
  ORDER_STATUS_LABEL_FA,
} from "@/lib/types";
import { createLocation } from "@/lib/services";
import {
  EMPTY_ORDER_META,
  OrderMeta,
  PAYMENT_METHODS,
  getLastDeliveryTime,
  getOrderMeta,
  saveLastDeliveryTime,
  getLastReturnTime,
  saveLastReturnTime,
  saveOrderMeta,
} from "@/lib/order-metadata";
import Cookies from "js-cookie";

// localStorage keys for last used locations
const LAST_ORDER_ORIGIN_KEY = "lastOrderOrigin";
const LAST_ORDER_DESTINATION_KEY = "lastOrderDestination";

interface SavedLocation {
  id: number;
  name: string;
}

function getLastUsedOrigin(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LAST_ORDER_ORIGIN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getLastUsedDestination(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LAST_ORDER_DESTINATION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveLastUsedOrigin(location: Location) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LAST_ORDER_ORIGIN_KEY,
      JSON.stringify({
        id: location.id,
        name: location.title || location.name,
      }),
    );
  } catch {
    // ignore storage errors
  }
}

function saveLastUsedDestination(location: Location) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LAST_ORDER_DESTINATION_KEY,
      JSON.stringify({
        id: location.id,
        name: location.title || location.name,
      }),
    );
  } catch {
    // ignore storage errors
  }
}

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  drivers: Driver[];
  locations: Location[];
  onSave: (
    order:
      | Omit<Order, "id" | "trackingCode" | "createdAt" | "updatedAt">
      | Order,
  ) => void | Promise<void> | Promise<Order | void>;
  onLocationCreated?: (location: Location) => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  {
    value: OrderStatus.PENDING,
    label: ORDER_STATUS_LABEL_FA[OrderStatus.PENDING],
  },
  {
    value: OrderStatus.ASSIGNED,
    label: ORDER_STATUS_LABEL_FA[OrderStatus.ASSIGNED],
  },
  {
    value: OrderStatus.CANCEL,
    label: ORDER_STATUS_LABEL_FA[OrderStatus.CANCEL],
  },
];

const emptyForm = {
  pickupLocationId: null as number | null,
  pickupAddress: "",
  pickupLocationName: "",
  pickupLat: null as number | null,
  pickupLng: null as number | null,
  dropoffLocationId: null as number | null,
  dropoffAddress: "",
  dropoffLocationName: "",
  dropoffLat: null as number | null,
  dropoffLng: null as number | null,
  assignType: "AI" as AssignType,
  contactPerson: "",
  sender: "",
  sender_mobile: "",
  deliveryTime: null as Date | null,
  price: null as number | null,
  description: "",
  status: OrderStatus.PENDING,
  mobile: "",
  returnTime: null as Date | null,
  productCode: "",
  driverId: null as number | null,
};

export function OrderFormDialog({
  open,
  onOpenChange,
  order,
  drivers,
  locations,
  onSave,
  onLocationCreated,
}: OrderFormDialogProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [meta, setMeta] = useState<OrderMeta>(EMPTY_ORDER_META);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pickupLocationFormOpen, setPickupLocationFormOpen] = useState(false);
  const [dropoffLocationFormOpen, setDropoffLocationFormOpen] = useState(false);
  const isManualAssignment = formData.assignType === "MANUAL";
  const userId = Number(Cookies.get("userId") ?? 0);

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
            loc.title === order.locationName || loc.address === order.address,
        );

      setFormData({
        pickupLocationId: pickupLoc?.id ?? null,
        pickupAddress: pickupLoc?.address ?? "",
        pickupLocationName: pickupLoc?.title ?? "",
        pickupLat: pickupLoc?.lat ?? null,
        pickupLng: pickupLoc?.lng ?? null,
        dropoffLocationId: legacyDrop?.id ?? null,
        dropoffAddress: order.address,
        dropoffLocationName: order.locationName || "",
        dropoffLat: order.lat ?? legacyDrop?.lat ?? null,
        dropoffLng: order.lng ?? legacyDrop?.lng ?? null,
        assignType: order.assignType,
        contactPerson: order.contactPerson,
        sender: order.sender || "",
        sender_mobile: order.sender_mobile || "",
        deliveryTime: new Date(order.deliveryTime),
        description: order.description || "",
        status: order.status,
        mobile: order.mobile || "",
        returnTime: order.returnTime ? new Date(order.returnTime) : null,
        productCode: order.productCode || "",
        driverId: order.driverId || null,
        price: order.price || null,
      });

      // بارگذاری متادیتای محلی سفارش (فیلدهایی که در API نیستند)
      const savedMeta = getOrderMeta(order.id);
      if (savedMeta) {
        setMeta(savedMeta);
      } else {
        // مهاجرت ملایم: گیرنده از contactPerson و موبایل از سفارش
        setMeta({
          ...EMPTY_ORDER_META,
          receiverName: order.contactPerson || "",
          receiverMobile: order.mobile || "",
          miscAddress: order.address || "",
        });
      }
      setShowErrors(false);
    } else {
      // For new orders, load last used locations from localStorage
      const lastOrigin = getLastUsedOrigin();
      const lastDestination = getLastUsedDestination();

      // پیش‌فرض زمان تحویل: آخرین سفارش، در غیر این صورت زمان فعلی سیستم
      const defaultDeliveryTime = getLastDeliveryTime() ?? new Date();

      // let newForm = { ...emptyForm, deliveryTime: defaultDeliveryTime };

      const defaultReturnTime = getLastReturnTime();
      let newForm = {
        ...emptyForm,
        deliveryTime: defaultDeliveryTime,
        returnTime: defaultReturnTime,
      };
      if (lastOrigin) {
        const originLoc = locations.find((l) => l.id === lastOrigin.id);
        if (originLoc) {
          newForm = {
            ...newForm,
            pickupLocationId: originLoc.id,
            pickupAddress: originLoc.address,
            pickupLocationName: originLoc.title || originLoc.name,
            pickupLat: originLoc.lat,
            pickupLng: originLoc.lng,
          };
        }
      }

      if (lastDestination) {
        const destLoc = locations.find((l) => l.id === lastDestination.id);
        if (destLoc) {
          newForm = {
            ...newForm,
            dropoffLocationId: destLoc.id,
            dropoffAddress: destLoc.address,
            dropoffLocationName: destLoc.title || destLoc.name,
            dropoffLat: destLoc.lat,
            dropoffLng: destLoc.lng,
          };
        }
      }

      setFormData(newForm);
      setMeta(EMPTY_ORDER_META);
      setShowErrors(false);
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
        pickupAddress: "",
        pickupLocationName: "",
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
        dropoffAddress: "",
        dropoffLocationName: "",
        dropoffLat: null,
        dropoffLng: null,
      }));
    }
  };

  // Handler for creating a new pickup location
  const handleSavePickupLocation = async (
    locationData: Omit<Location, "id" | "createdAt" | "updatedAt"> | Location,
  ) => {
    if ("id" in locationData && "createdAt" in locationData) return; // Skip updates, only create new

    const created = await createLocation({ ...locationData, userId });

    // Notify parent to update locations list
    onLocationCreated?.(created);

    // Auto-select the newly created location as pickup
    handlePickupChange(created);
    setPickupLocationFormOpen(false);
  };

  // Handler for creating a new dropoff location
  const handleSaveDropoffLocation = async (
    locationData: Omit<Location, "id" | "createdAt" | "updatedAt"> | Location,
  ) => {
    if ("id" in locationData && "createdAt" in locationData) return; // Skip updates, only create new

    const created = await createLocation({ ...locationData, userId });

    // Notify parent to update locations list
    onLocationCreated?.(created);

    // Auto-select the newly created location as dropoff
    handleDropoffChange(created);
    setDropoffLocationFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (
      !formData.deliveryTime ||
      formData.pickupLocationId == null ||
      formData.dropoffLocationId == null
    ) {
      return;
    }
    if (formData.assignType === "MANUAL" && !formData.driverId) return;

    // قوانین کسب‌وکار: سفارش‌دهنده (نام و موبایل) الزامی است
    // if (!meta.placerName.trim() || !meta.placerMobile.trim()) {
    //   return;
    // }
    // در سفارش متفرقه، آدرس اختصاصی الزامی است
    if (meta.isMiscellaneous && !meta.miscAddress.trim()) {
      return;
    }

    // Save selected locations to localStorage for next time
    const pickupLoc = locations.find((l) => l.id === formData.pickupLocationId);
    const dropoffLoc = locations.find(
      (l) => l.id === formData.dropoffLocationId,
    );
    if (pickupLoc) saveLastUsedOrigin(pickupLoc);
    if (dropoffLoc) saveLastUsedDestination(dropoffLoc);

    const selectedDriver = formData.driverId
      ? drivers.find((d) => d.id === formData.driverId) || null
      : null;

    // در سفارش متفرقه از آدرس اختصاصی استفاده می‌شود، در غیر این صورت آدرس مقصد پیش‌فرض
    const effectiveAddress =
      meta.isMiscellaneous && meta.miscAddress.trim()
        ? meta.miscAddress.trim()
        : formData.dropoffAddress;

    const orderData = {
      address: effectiveAddress,
      assignType: formData.assignType,
      contactPerson:
        formData.contactPerson || meta.receiverName || meta.placerName,
      sender: formData.sender || null,
      sender_mobile: formData.sender_mobile || null,
      deliveryTime: formData.deliveryTime,
      price: formData.price || null,
      description: formData.description || null,
      status: formData.status,
      mobile:
        formData.mobile || meta.receiverMobile || meta.placerMobile || null,
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
      // زمان تحویل را برای پیش‌فرض سفارش بعدی ذخیره کن
      saveLastDeliveryTime(formData.deliveryTime);
      saveLastReturnTime(formData.returnTime);

      let savedId: number | string | undefined;
      if (order) {
        const result = await onSave({
          ...orderData,
          id: order.id,
          trackingCode: order.id,
          createdAt: order.createdAt,
          updatedAt: new Date(),
        });
        savedId = (
          result && typeof result === "object" && "id" in result
            ? result.id
            : order.id
        ) as number;
      } else {
        const result = await onSave(orderData);
        savedId =
          result && typeof result === "object" && "id" in result
            ? (result.id as number)
            : undefined;
      }

      // ذخیرهٔ فیلدهای تکمیلی به‌صورت محلی (خارج از قرارداد API)
      if (savedId != null) {
        saveOrderMeta(savedId, meta);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving order:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const placerValid =
    meta.placerName.trim().length > 0 && meta.placerMobile.trim().length > 0;
  const miscValid = !meta.isMiscellaneous || meta.miscAddress.trim().length > 0;

  const canSubmit =
    !!formData.deliveryTime &&
    formData.pickupLocationId != null &&
    formData.dropoffLocationId != null &&
    // placerValid &&
    miscValid &&
    !isSaving;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {order ? "ویرایش سفارش" : "افزودن سفارش جدید"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 py-4">
              <div className="text-sm font-medium text-foreground border-b border-border pb-2">
                فیلدهای ضروری
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pickup-location" className="text-foreground">
                  آدرس مبدأ *
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <LocationSelect
                      locations={locations}
                      value={formData.pickupLocationId}
                      onChange={handlePickupChange}
                      placeholder="انتخاب مبدأ از لیست..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPickupLocationFormOpen(true)}
                    className="border-border shrink-0"
                    title="افزودن مکان جدید"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.pickupAddress && (
                  <p className="text-xs  mt-1">{formData.pickupAddress}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dropoff-location" className="text-foreground">
                  آدرس مقصد *
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <LocationSelect
                      locations={locations}
                      value={formData.dropoffLocationId}
                      onChange={handleDropoffChange}
                      placeholder="انتخاب مقصد از لیست..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDropoffLocationFormOpen(true)}
                    className="border-border shrink-0"
                    title="افزودن مکان جدید"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.dropoffAddress && (
                  <p className="text-xs  mt-1">{formData.dropoffAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-6 grid-cols-1">
                  <div>
                    <Label className="text-foreground mb-2">زمان تحویل *</Label>
                    <PersianDatePicker
                      value={formData.deliveryTime || undefined}
                      onChange={(date) =>
                        setFormData({ ...formData, deliveryTime: date || null })
                      }
                      placeholder="انتخاب تاریخ و ساعت"
                      showTimePicker
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-2">زمان بازگشت</Label>
                    <PersianDatePicker
                      value={formData.returnTime || undefined}
                      onChange={(date) =>
                        setFormData({ ...formData, returnTime: date || null })
                      }
                      placeholder="انتخاب تاریخ و ساعت"
                      showTimePicker
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-between">
                  <div className="grid gap-2 w-full">
                    <Label htmlFor="price" className="text-foreground">
                      قیمت
                    </Label>
                    <Input
                      id="price"
                      inputMode="numeric"
                      value={
                        formData.price !== null && formData.price !== undefined
                          ? formData.price.toLocaleString("en-US")
                          : ""
                      }
                      onChange={(e) => {
                        // حذف هر چیزی غیر از عدد
                        const raw = e.target.value.replace(/[^\d]/g, "");

                        setFormData({
                          ...formData,
                          price: raw === "" ? null : Number(raw),
                        });
                      }}
                      placeholder="قیمت"
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* اطلاعات سفارش‌دهنده و گیرنده */}
              <div className="text-sm font-medium text-foreground border-b border-border pb-2">
                سفارش‌دهنده و گیرنده
              </div>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="placerName" className="text-foreground">
                      نام گیرنده
                    </Label>
                    <Input
                      id="placerName"
                      value={meta.placerName}
                      onChange={(e) =>
                        setMeta({ ...meta, placerName: e.target.value })
                      }
                      placeholder=" نام و نام خانوادگی"
                      required={false}
                      className="bg-secondary border-border text-foreground"
                    />
                    {/* {showErrors && !meta.placerName.trim() && (
                      <p className="text-xs text-destructive">
                        نام سفارش‌دهنده الزامی است.
                      </p>
                    )} */}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="placerMobile" className="text-foreground">
                      موبایل گیرنده
                    </Label>
                    <Input
                      id="placerMobile"
                      dir="ltr"
                      value={meta.placerMobile}
                      onChange={(e) =>
                        setMeta({ ...meta, placerMobile: e.target.value })
                      }
                      placeholder="09123456789"
                      className="bg-secondary border-border text-foreground"
                    />
                    {/* {showErrors && !meta.placerMobile.trim() && (
                      <p className="text-xs text-destructive">
                        موبایل سفارش‌دهنده الزامی است.
                      </p>
                    )} */}
                  </div>
                </div>

                {/* <div className='flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3'>
                  <div>
                    <Label className='text-foreground'>گیرنده همان سفارش‌دهنده است</Label>
                    <p className='text-xs text-muted-foreground mt-1'>برای کپی اطلاعات سفارش‌دهنده به گیرنده فعال کنید</p>
                  </div>
                  <Switch
                    checked={
                      meta.receiverName === meta.placerName &&
                      meta.receiverMobile === meta.placerMobile &&
                      meta.placerName.trim().length > 0
                    }
                    onCheckedChange={(checked) =>
                      setMeta({
                        ...meta,
                        receiverName: checked ? meta.placerName : '',
                        receiverMobile: checked ? meta.placerMobile : '',
                      })
                    }
                  />
                </div> */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="sender" className="text-foreground">
                      سفارش‌دهنده*
                    </Label>
                    <Input
                      id="sender"
                      value={formData.sender}
                      onChange={(e) =>
                        setFormData({ ...formData, sender: e.target.value })
                      }
                      placeholder="نام فرستنده"
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sender_mobile" className="text-foreground">
                      موبایل سفارش‌دهنده*
                    </Label>
                    <Input
                      id="sender_mobile"
                      value={formData.sender_mobile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sender_mobile: e.target.value,
                        })
                      }
                      placeholder="موبایل فرستنده"
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* اطلاعات پرداخت */}
              <div className="text-sm font-medium text-foreground border-b border-border pb-2">
                اطلاعات پرداخت
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-foreground">زمان پرداخت</Label>
                  <PersianDatePicker
                    value={
                      meta.paymentTime ? new Date(meta.paymentTime) : undefined
                    }
                    onChange={(date) =>
                      setMeta({
                        ...meta,
                        paymentTime: date ? date.toISOString() : null,
                      })
                    }
                    placeholder="انتخاب تاریخ و ساعت"
                    showTimePicker
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod" className="text-foreground">
                    روش پرداخت
                  </Label>
                  <Select
                    value={meta.paymentMethod || "none"}
                    onValueChange={(value) =>
                      setMeta({
                        ...meta,
                        paymentMethod: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground w-full">
                      <SelectValue placeholder="انتخاب روش پرداخت" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none" className="text-foreground">
                        نامشخص
                      </SelectItem>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem
                          key={m.value}
                          value={m.value}
                          className="text-foreground"
                        >
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* سفارش متفرقه */}
              {/* <div className='grid gap-4'>
                <div className='flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3'>
                  <div>
                    <Label className='text-foreground'>سفارش متفرقه</Label>
                    <p className='text-xs text-muted-foreground mt-1'>برای ثبت آدرس ارسال اختصاصی فعال کنید</p>
                  </div>
                  <Switch
                    checked={meta.isMiscellaneous}
                    onCheckedChange={(checked) => setMeta({ ...meta, isMiscellaneous: checked })}
                  />
                </div>
                {meta.isMiscellaneous && (
                  <div className='grid gap-2'>
                    <Label
                      htmlFor='miscAddress'
                      className='text-foreground'
                    >
                      آدرس ارسال اختصاصی *
                    </Label>
                    <Textarea
                      id='miscAddress'
                      value={meta.miscAddress}
                      onChange={(e) => setMeta({ ...meta, miscAddress: e.target.value })}
                      placeholder='آدرس کامل ارسال این سفارش'
                      className='bg-secondary border-border text-foreground'
                      rows={2}
                    />
                    {showErrors && meta.isMiscellaneous && !meta.miscAddress.trim() && (
                      <p className='text-xs text-destructive'>آدرس اختصاصی برای سفارش متفرقه الزامی است.</p>
                    )}
                  </div>
                )}
              </div> */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="driver" className="text-foreground">
                    راننده{isManualAssignment ? " *" : ""}
                  </Label>
                  <Select
                    value={formData.driverId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        driverId: value === "none" ? null : parseInt(value),
                      })
                    }
                    disabled={!isManualAssignment}
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground w-full">
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
                        driverId: value === "AI" ? null : formData.driverId,
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
                {/* <div className='grid gap-2'>
                  <Label
                    htmlFor='mobile'
                    className='text-foreground'
                  >
                    موبایل
                  </Label>
                  <Input
                    id='mobile'
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder='شماره موبایل'
                    className='bg-secondary border-border text-foreground'
                  />
                </div> */}
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
                {isSaving
                  ? "در حال ذخیره..."
                  : order
                    ? "ذخیره تغییرات"
                    : "افزودن"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Location creation dialogs */}
      <LocationFormDialog
        open={pickupLocationFormOpen}
        onOpenChange={setPickupLocationFormOpen}
        onSave={handleSavePickupLocation}
      />
      <LocationFormDialog
        open={dropoffLocationFormOpen}
        onOpenChange={setDropoffLocationFormOpen}
        onSave={handleSaveDropoffLocation}
      />
    </>
  );
}
