'use client';

import { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DeliveryRoute, Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DraggableOrder } from './draggable-order';
import { Truck, Package, Clock, MapPin, Printer, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface DriverSlipProps {
  route: DeliveryRoute;
  orders: Order[];
  tripType?: 'delivery' | 'return';
}

export function DriverSlip({ route, orders, tripType = 'delivery' }: DriverSlipProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { setNodeRef, isOver } = useDroppable({
    id: `route-${route.id}`,
    data: { routeId: route.id },
  });

  const isDelivery = tripType === 'delivery';
  const tripLabel = isDelivery ? 'رفت' : 'برگشت';
  const TripIcon = isDelivery ? ArrowLeftCircle : ArrowRightCircle;

  const handlePrintSlip = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>فیش ${route.driver.name}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid black;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .trip-direction {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
            padding: 8px;
            border: 2px solid ${isDelivery ? '#22c55e' : '#f59e0b'};
            border-radius: 8px;
            background-color: ${isDelivery ? '#f0fdf4' : '#fffbeb'};
          }
          .trip-icon {
            width: 24px;
            height: 24px;
          }
          .driver-info {
            border: 2px solid black;
            padding: 16px;
            margin-bottom: 16px;
          }
          .driver-info-grid {
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f0f0f0;
          }
          .signature {
            display: flex;
            justify-content: space-between;
            border-top: 2px solid black;
            padding-top: 16px;
            margin-top: 16px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid black;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="trip-direction">
            <svg class="trip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${
                isDelivery
                  ? '<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8l4 4-4 4"/>'
                  : '<circle cx="12" cy="12" r="10"/><path d="M16 12H8M12 16l-4-4 4-4"/>'
              }
            </svg>
            <span>${tripLabel}</span>
          </div>
          <h1>فیش تحویل مرسولات</h1>
          <p>تاریخ چاپ: ${format(new Date(), 'yyyy/MM/dd HH:mm')}</p>
        </div>
        <div class="driver-info">
          <div class="driver-info-grid">
            <div>
              <h2>${route.routeName}</h2>
              <p>راننده: ${route.driver.name}</p>
              <p>خودرو: ${route.driver.car}</p>
            </div>
            <div style="text-align: left;">
              <p>بازه زمانی: ${format(new Date(route.timeWindow.start), 'HH:mm')} - ${format(new Date(route.timeWindow.end), 'HH:mm')}</p>
              <p>تعداد مرسولات: ${orders.length}</p>
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>کد پیگیری</th>
              <th>نام مقصد</th>
              <th>آدرس</th>
              <th>شخص تحویل گیرنده</th>
              <th>زمان تحویل</th>
              <th>امضا</th>
            </tr>
          </thead>
          <tbody>
            ${orders
              .map(
                (order, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td style="font-family: monospace;">${order.id}</td>
                <td>${order.locationName || '-'}</td>
                <td>${order.address}</td>
                <td>${order.contactPerson}</td>
                <td>${format(new Date(order.deliveryTime), 'yyyy/MM/dd HH:mm')}</td>
                <td style="width: 80px;"></td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        <div class="signature">
          <p>امضای راننده: ___________________</p>
          <p>تاریخ: ___________________</p>
        </div>
        <div class="footer">
          <p>سامانه مدیریت لجستیک - تمامی حقوق محفوظ است</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Card
      ref={setNodeRef}
      className={`bg-card border-border transition-all ${isOver ? 'ring-2 ring-primary border-primary' : ''}`}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg text-foreground flex items-center gap-2'>
            <MapPin className='h-5 w-5 text-primary' />
            {route.routeName}
          </CardTitle>
          <div className='flex sm:items-center gap-2 '>
            {/* Trip Direction Badge */}

            <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
              <Badge
                className={`flex items-center gap-1 ${
                  isDelivery
                    ? 'bg-green-500/20 text-green-600 border-green-500/30'
                    : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                }`}
              >
                <TripIcon className='h-3 w-3' />
                {tripLabel}
              </Badge>
              <Badge className='bg-primary/20 text-primary border-primary/30'>مسیر #{route.id}</Badge>
            </div>
            <Button
              size='sm'
              variant='outline'
              onClick={handlePrintSlip}
              className='flex items-center gap-1 border-border'
            >
              <Printer className='h-4 w-4' />
              چاپ فیش
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Driver Info */}
        <div className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
          <div className='p-2 rounded-full bg-primary/20'>
            <Truck className='h-5 w-5 text-primary' />
          </div>
          <div>
            <p className='font-medium text-foreground'>{route?.driver?.driverName}</p>
            <p className='text-sm '>{route.driver.car}</p>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex items-center gap-2 p-3 rounded-lg bg-muted/30'>
            <Package className='h-4 w-4 ' />
            <div>
              <p className='text-xs '>تعداد سفارشات</p>
              <p className='font-semibold text-foreground'>{orders.length}</p>
            </div>
          </div>
          <div className='flex items-center gap-2 p-3 rounded-lg bg-muted/30'>
            <Clock className='h-4 w-4 ' />
            <div>
              <p className='text-xs '>بازه زمانی</p>
              <p className='text-sm text-foreground'>
                {format(new Date(route.timeWindow.start), 'HH:mm')} - {format(new Date(route.timeWindow.end), 'HH:mm')}
              </p>
            </div>
          </div>
        </div>

        {/* Orders List - Draggable */}
        <div className='space-y-2'>
          <p className='text-sm font-medium text-foreground'>ترتیب تحویل (قابل جابجایی):</p>
          <SortableContext
            items={orders.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-2 min-h-[60px]'>
              {orders.length === 0 ? (
                <div className='flex items-center justify-center py-8 border-2 border-dashed border-border rounded-lg  text-sm'>
                  سفارش را به اینجا بکشید
                </div>
              ) : (
                orders.map((order, index) => (
                  <DraggableOrder
                    key={order.id}
                    order={order}
                    index={index}
                    showDetails
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </CardContent>

      {/* Hidden print content */}
      <div
        ref={printRef}
        className='hidden'
      />
    </Card>
  );
}
