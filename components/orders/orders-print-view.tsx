'use client';

import { Order, ORDER_STATUS_LABEL_FA, getDisplayedOrderDriver } from '@/lib/types';
import { format } from 'date-fns-jalali';
import { getOrderMeta } from '@/lib/order-metadata';

interface OrdersPrintViewProps {
  /** سفارش‌هایی که باید چاپ شوند (یک سفارش برای چاپ تکی، همه برای چاپ کلی). */
  orders: Order[];
}

function formatJalali(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'yyyy/MM/dd HH:mm');
  } catch {
    return '-';
  }
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-black/40 py-1">
      <span className="font-bold">{label}:</span>
      <span className="text-left">{value || '-'}</span>
    </div>
  );
}

/** کارت چاپ کامل یک سفارش با تمام اطلاعات مهم. */
function PrintableOrderCard({ order }: { order: Order }) {
  const meta = getOrderMeta(order.id);
  const driver = getDisplayedOrderDriver(order);
  const pickup = meta?.isMiscellaneous && meta.miscAddress ? meta.miscAddress : order.address;
  const dropoff = order.locationName || order.address || '-';

  return (
    <div className="order-print-card border-2 border-black p-6 mb-6 break-inside-avoid">
      <h2 className="text-lg font-bold text-center border-b-2 border-black pb-2 mb-3">
        سفارش #{order.id} — کد پیگیری {order.trackingCode}
      </h2>
      <div className="space-y-1 text-sm">
        <Field label="گیرنده (تماس)" value={order.contactPerson} />
        <Field label="موبایل گیرنده" value={order.mobile ? <span dir="ltr">{order.mobile}</span> : '-'} />
        <Field label="فرستنده" value={order.sender} />
        <Field
          label="موبایل فرستنده"
          value={order.sender_mobile ? <span dir="ltr">{order.sender_mobile}</span> : '-'}
        />
        <Field label="راننده" value={driver?.name} />
        <Field label="محل بارگیری" value={pickup} />
        <Field label="محل تحویل" value={dropoff} />
        <Field label="زمان تحویل" value={formatJalali(order.deliveryTime)} />
        <Field label="زمان بازگشت" value={formatJalali(order.returnTime)} />
        <Field
          label="قیمت"
          value={order.price != null ? `${Number(order.price).toLocaleString('fa-IR')} ریال` : '-'}
        />
        <Field label="وضعیت" value={ORDER_STATUS_LABEL_FA[order.status]} />
        <Field label="توضیحات" value={order.description} />
      </div>
    </div>
  );
}

/**
 * نمای چاپ سفارش‌ها. روی صفحه پنهان است و فقط هنگام چاپ نمایش داده می‌شود.
 * با استایل‌های چاپ در globals.css، تنها این کانتینر چاپ می‌شود و بقیهٔ صفحه پنهان می‌ماند.
 */
export function OrdersPrintView({ orders }: OrdersPrintViewProps) {
  if (!orders || orders.length === 0) return null;

  return (
    <div className="order-print-container hidden print:block bg-white text-black p-8" dir="rtl">
      {orders.length > 1 && (
        <h1 className="text-xl font-bold text-center mb-6">لیست سفارش‌ها ({orders.length.toLocaleString('fa-IR')} مورد)</h1>
      )}
      {orders.map((order) => (
        <PrintableOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
