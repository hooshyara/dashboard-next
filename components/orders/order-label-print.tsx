"use client";

import { Order } from "@/lib/types";
import { format } from "date-fns-jalali";
import { OrderMeta, paymentMethodLabel } from "@/lib/order-metadata";

interface OrderLabelPrintProps {
  order: Order | null;
  meta: OrderMeta | null;
  /** نوع چاپ: برچسب ارسال یا رسید/فاکتور */
  mode: "label" | "receipt";
}

/**
 * نمای چاپ سفارش. روی صفحه پنهان است و فقط هنگام چاپ نمایش داده می‌شود.
 * - برچسب: تاریخ ارسال، مقصد، نام مشتری
 * - رسید: نام و موبایل سفارش‌دهنده، قیمت، روش و زمان پرداخت
 */
export function OrderLabelPrint({ order, meta, mode }: OrderLabelPrintProps) {
  if (!order) return null;

  const address =
    meta?.isMiscellaneous && meta.miscAddress
      ? meta.miscAddress
      : order.address;
  const customerName =
    meta?.receiverName || order.contactPerson || meta?.placerName || "-";
  const deliveryDate = order.deliveryTime
    ? format(new Date(order.deliveryTime), "yyyy/MM/dd HH:mm")
    : "-";

  return (
    <div className="order-print-container hidden print:block bg-white text-black p-8">
      {mode === "label" ? (
        <div className="border-2 border-black p-6 max-w-md mx-auto">
          <h1 className="text-xl font-bold text-center border-b-2 border-black pb-3 mb-4">
            برچسب ارسال
          </h1>
          <div className="space-y-3 text-base">
            <div className="flex justify-between gap-4">
              <span className="font-bold">تاریخ ارسال:</span>
              <span>{deliveryDate}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-bold">نام مشتری:</span>
              <span>{customerName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold">مقصد:</span>
              <span className="leading-relaxed">
                {order.locationName ? `${order.locationName} — ` : ""}
                {address}
              </span>
            </div>
            {order.mobile && (
              <div className="flex justify-between gap-4">
                <span className="font-bold">موبایل:</span>
                <span dir="ltr">{order.mobile}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="font-bold">کد پیگیری:</span>
              <span className="font-mono">{order.trackingCode}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-black p-6 max-w-md mx-auto">
          <h1 className="text-xl font-bold text-center border-b-2 border-black pb-3 mb-4">
            رسید سفارش
          </h1>
          <div className="space-y-3 text-base">
            <div className="flex justify-between gap-4">
              <span className="font-bold">سفارش‌دهنده:</span>
              <span>{meta?.placerName || "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-bold">موبایل سفارش‌دهنده:</span>
              <span dir="ltr">{meta?.placerMobile || "-"}</span>
            </div>
            {(meta?.receiverName || meta?.receiverMobile) && (
              <div className="flex justify-between gap-4">
                <span className="font-bold">گیرنده:</span>
                <span>
                  {meta?.receiverName || "-"}
                  {meta?.receiverMobile ? ` (${meta.receiverMobile})` : ""}
                </span>
              </div>
            )}
            {(order.sender || order.sender_mobile) && (
              <div className="flex justify-between gap-4">
                <span className="font-bold">فرستنده:</span>
                <span>
                  {order.sender || "-"}
                  {order.sender_mobile ? ` (${order.sender_mobile})` : ""}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-black pt-2">
              <span className="font-bold">قیمت سفارش:</span>
              <span>
                {order.price != null
                  ? `${Number(order.price).toLocaleString("fa-IR")} ریال`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-bold">روش پرداخت:</span>
              <span>{paymentMethodLabel(meta?.paymentMethod)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-bold">زمان پرداخت:</span>
              <span>
                {meta?.paymentTime
                  ? format(new Date(meta.paymentTime), "yyyy/MM/dd HH:mm")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-black pt-2">
              <span className="font-bold">کد پیگیری:</span>
              <span className="font-mono">{order.trackingCode}</span>
            </div>
          </div>
          <p className="text-center text-xs mt-6 pt-3 border-t border-black">
            با تشکر از خرید شما
          </p>
        </div>
      )}
    </div>
  );
}
