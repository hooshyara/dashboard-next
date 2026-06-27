'use client';

/**
 * فیلدهای تکمیلی سفارش که در قرارداد فعلی API وجود ندارند و به‌صورت محلی
 * (localStorage) نگه‌داری می‌شوند. این فیلدها سمت سرور ذخیره نمی‌شوند.
 */
export interface OrderMeta {
  /** زمان پرداخت (ISO-8601) */
  paymentTime: string | null;
  /** روش پرداخت */
  paymentMethod: string;
  /** نام و نام خانوادگی سفارش‌دهنده (الزامی) */
  placerName: string;
  /** موبایل سفارش‌دهنده (الزامی) */
  placerMobile: string;
  /** نام گیرنده (اختیاری) */
  receiverName?: string;
  /** موبایل گیرنده (اختیاری) */
  receiverMobile?: string;
  /** سفارش متفرقه؟ */
  isMiscellaneous: boolean;
  /** آدرس اختصاصی سفارش متفرقه */
  miscAddress: string;
}

export const EMPTY_ORDER_META: OrderMeta = {
  paymentTime: null,
  paymentMethod: '',
  placerName: '',
  placerMobile: '',
  receiverName: '',
  receiverMobile: '',
  isMiscellaneous: false,
  miscAddress: '',
};

/** روش‌های پرداخت قابل انتخاب در فرم. */
export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'CASH', label: 'نقدی' },
  { value: 'CARD', label: 'کارت به کارت / انتقال' },
  { value: 'CARD_READER', label: 'کارتخوان' },
  { value: 'ONLINE', label: 'پرداخت آنلاین' },

];

export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return '-';
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

const META_PREFIX = 'orderMeta:';
const LAST_DELIVERY_TIME_KEY = 'lastOrderDeliveryTime';
const LAST_RETURN_TIME_KEY = "lastReturnTime";

export function getOrderMeta(orderId: number | string): OrderMeta | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${META_PREFIX}${orderId}`);
    if (!raw) return null;
    return { ...EMPTY_ORDER_META, ...(JSON.parse(raw) as Partial<OrderMeta>) };
  } catch {
    return null;
  }
}

export function saveOrderMeta(orderId: number | string, meta: OrderMeta): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${META_PREFIX}${orderId}`, JSON.stringify(meta));
  } catch {
    // ignore storage errors
  }
}

/** آخرین زمان تحویل ثبت‌شده (برای پیش‌فرض سفارش بعدی). */
export function getLastDeliveryTime(): Date | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_DELIVERY_TIME_KEY);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function saveLastDeliveryTime(date: Date): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_DELIVERY_TIME_KEY, date.toISOString());
  } catch {
    // ignore
  }
}


export function saveLastReturnTime(date?: Date | null) {
  if (!date) return;
  localStorage.setItem(LAST_RETURN_TIME_KEY, date.toISOString());
}

export function getLastReturnTime(): Date | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_RETURN_TIME_KEY);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

