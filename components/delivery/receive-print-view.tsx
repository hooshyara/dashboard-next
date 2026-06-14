'use client';

import { DeliveryRoute } from '@/lib/types';
import { format } from 'date-fns-jalali';

interface ReceivePrintViewProps {
  routes: DeliveryRoute[];
}

export function ReceivePrintView({ routes }: ReceivePrintViewProps) {
  return (
    <div className="print-container hidden print:block bg-white p-8">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold">لیست دریافت مرسولات</h1>
        <p className="text-sm mt-2">
          تاریخ چاپ: {format(new Date(), 'yyyy/MM/dd HH:mm')}
        </p>
      </div>

      {/* Routes */}
      {routes.map((route) => (
        <div key={route.id} className="mb-8 page-break-inside-avoid">
          {/* Route Header */}
          <div className="border-2 border-black p-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold">{route.routeName}</h2>
                <p className="text-sm">راننده: {route.driver.name}</p>
                <p className="text-sm">خودرو: {route.driver.car}</p>
              </div>
              <div className="text-left">
                <p className="text-sm">
                  بازه زمانی: {format(new Date(route.timeWindow.start), 'HH:mm')} -{' '}
                  {format(new Date(route.timeWindow.end), 'HH:mm')}
                </p>
                <p className="text-sm">تعداد مرسولات: {route.orders.length}</p>
                <p className="text-sm">
                  ظرفیت: {route.totalCapacity} / {route.driver.capacity}
                </p>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <table className="w-full border-collapse border-2 border-black text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-right">ردیف</th>
                <th className="border border-black p-2 text-right">کد پیگیری</th>
                <th className="border border-black p-2 text-right">آدرس</th>
                <th className="border border-black p-2 text-right">تحویل دهنده</th>
                <th className="border border-black p-2 text-right">زمان دریافت</th>
                <th className="border border-black p-2 text-right">امضا</th>
              </tr>
            </thead>
            <tbody>
              {route.orders.map((order, index) => (
                <tr key={order.id}>
                  <td className="border border-black p-2 text-center">{index + 1}</td>
                  <td className="border border-black p-2 font-mono">
                    {order.trackingCode}
                  </td>
                  <td className="border border-black p-2">{order.address}</td>
                  <td className="border border-black p-2">{order.contactPerson}</td>
                  <td className="border border-black p-2">
                    {format(new Date(order.returnTime ?? order.deliveryTime), 'HH:mm')}
                  </td>
                  <td className="border border-black p-2 w-24"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Driver Signature Area */}
          <div className="mt-4 flex justify-between border-t-2 border-black pt-4">
            <div>
              <p className="text-sm">امضای راننده: ___________________</p>
            </div>
            <div>
              <p className="text-sm">تاریخ: ___________________</p>
            </div>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="text-center text-xs mt-8 pt-4 border-t border-black">
        <p>سامانه مدیریت لجستیک - تمامی حقوق محفوظ است</p>
      </div>
    </div>
  );
}
