'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DriverSlip } from '@/components/delivery/driver-slip';
import { ReceivePrintView } from '@/components/delivery/receive-print-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PersianDatePicker } from '@/components/delivery/start-end-date-time';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Eye, LayoutGrid, List, RefreshCw, GripVertical, Check, Loader2, Container } from 'lucide-react';
import { DeliveryRoute, Order } from '@/lib/types';
import {
  buildDeliveryRouteAssignmentPayload,
  defaultOptimizerTimeRange,
  getDeliveryRoutes,
  saveDeliveryRouteAssignments,
} from '@/lib/services';
import DateCell from '@/components/ui/date-cell';

export default function ReceivePage() {
  const initialRange = defaultOptimizerTimeRange();
  const [rangeStart, setRangeStart] = useState<Date | null>(initialRange.start);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialRange.end);
  const [ordersInRange, setOrdersInRange] = useState<Order[]>([]);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes(isNeshanOptimizer?: boolean) {
    setRangeError(null);
    if (!rangeStart || !rangeEnd) {
      setRangeError('تاریخ شروع و پایان را انتخاب کنید.');
      setLoading(false);
      return;
    }
    if (rangeEnd.getTime() < rangeStart.getTime()) {
      setRangeError('تاریخ پایان باید بعد از تاریخ شروع باشد.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { orders: sorted, routes: routeData } = await getDeliveryRoutes(
        {
          start: rangeStart,
          end: rangeEnd,
        },
        isNeshanOptimizer,
      );
      setRoutes(routeData);
      setOrdersInRange(sorted);
    } catch (e) {
      console.error(e);
      setRoutes([]);
      setOrdersInRange([]);
      setRangeError('خطا در بارگذاری داده‌ها. اتصال به سرور را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmEdits() {
    const payload = buildDeliveryRouteAssignmentPayload(routes);
    setConfirmSaving(true);
    try {
      await saveDeliveryRouteAssignments(payload);
    } finally {
      setConfirmSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDragStart(event: DragStartEvent) {
    const orderId = event.active.id as number;
    for (const route of routes) {
      const order = route.orders.find((o) => o.id === orderId);
      if (order) {
        setActiveOrder(order);
        break;
      }
    }
  }

  function handleDragOver(_event: DragOverEvent) {
    // visual feedback placeholder
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;

    const orderId = active.id as number;
    const overId = over.id as number | string;

    setRoutes((prevRoutes) => {
      const overData = over.data.current;
      const targetRouteId =
        overData?.routeId ?? prevRoutes.find((route) => route.orders.some((order) => order.id === overId))?.id;
      if (!targetRouteId) return prevRoutes;

      const sourceRouteIndex = prevRoutes.findIndex((route) => route.orders.some((order) => order.id === orderId));
      if (sourceRouteIndex === -1) return prevRoutes;

      const sourceRoute = prevRoutes[sourceRouteIndex];
      const sourceOrderIndex = sourceRoute.orders.findIndex((order) => order.id === orderId);
      if (sourceOrderIndex === -1) return prevRoutes;

      const targetRouteIndex = prevRoutes.findIndex((route) => route.id === targetRouteId);
      if (targetRouteIndex === -1) return prevRoutes;

      const targetRoute = prevRoutes[targetRouteIndex];
      const overOrderId = typeof overId === 'number' ? overId : Number(overId);
      const targetOrderIndex = targetRoute.orders.findIndex((order) => order.id === overOrderId);

      if (sourceRouteIndex === targetRouteIndex) {
        if (targetOrderIndex === -1 || sourceOrderIndex === targetOrderIndex) return prevRoutes;

        const reorderedOrders = arrayMove(sourceRoute.orders, sourceOrderIndex, targetOrderIndex);
        return prevRoutes.map((route, index) =>
          index === sourceRouteIndex ? { ...route, orders: reorderedOrders } : route,
        );
      }

      const movedOrder = sourceRoute.orders[sourceOrderIndex];
      if (!movedOrder) return prevRoutes;

      const sourceOrders = sourceRoute.orders.filter((order) => order.id !== orderId);
      const targetOrders = [...targetRoute.orders];
      const movedOrderWithTargetDriver = {
        ...movedOrder,
        driver: targetRoute.driver,
        driverId: targetRoute.driver.id,
      };

      if (targetOrderIndex === -1) {
        targetOrders.push(movedOrderWithTargetDriver);
      } else {
        targetOrders.splice(targetOrderIndex, 0, movedOrderWithTargetDriver);
      }

      return prevRoutes.map((route, index) => {
        if (index === sourceRouteIndex) return { ...route, orders: sourceOrders };
        if (index === targetRouteIndex) return { ...route, orders: targetOrders };
        return route;
      });
    });
  }

  const totalOrders = routes.reduce((sum, r) => sum + r.orders.length, 0);
  const totalCapacity = routes.reduce((sum, r) => sum + r.totalCapacity, 0);

  return (
    <DashboardLayout title='لیست دریافت'>
      {/* Summary Stats */}
      <div className='grid gap-4 grid-cols-2 sm:grid-cols-3 mb-4 no-print'>
        <Card className='bg-card border-border'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm '>تعداد مسیرها</p>
                <p className='text-2xl font-bold text-foreground'>{routes.length}</p>
              </div>
              <div className='p-3 rounded-full bg-primary/20'>
                <LayoutGrid className='h-5 w-5 text-primary' />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='bg-card border-border'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm '>مرسولات در مسیرها</p>
                <p className='text-2xl font-bold text-foreground'>{totalOrders}</p>
                <p className='text-xs  mt-1'>در بازهٔ انتخاب‌شده (API): {ordersInRange.length}</p>
              </div>
              <div className='p-3 rounded-full bg-chart-2/20'>
                <List className='h-5 w-5 text-chart-2' />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='bg-card border-border'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm '>ظرفیت کل</p>
                <p className='text-2xl font-bold text-foreground'>{totalCapacity}</p>
              </div>
              <div className='p-3 rounded-full bg-chart-3/20'>
                <RefreshCw className='h-5 w-5 text-chart-3' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بازهٔ زمانی */}
      <Card className='bg-card border-border mb-4 no-print'>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label className='text-foreground'>بازه زمانی</Label>
              <PersianDatePicker
                startValue={rangeStart || undefined}
                endValue={rangeEnd || undefined}
                onChangeStartValue={(d) => setRangeStart(d ?? null)}
                onChangeEndValue={(d) => setRangeEnd(d ?? null)}
                placeholder='تاریخ و ساعت شروع و پایان'
                showTimePicker
                loadRoutes={loadRoutes}
              />
            </div>
          </div>
          {rangeError && (
            <p
              className='text-sm text-destructive'
              role='alert'
            >
              {rangeError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <Card className='bg-card border-border mb-4 no-print'>
        <CardHeader className='flex flex-col md:flex-row md:items-center md:justify-between py-4'>
          <div>
            <CardTitle className='text-foreground col-1'>مسیرهای دریافت</CardTitle>
            <p className='text-sm  mt-1'>مرسولات را با کشیدن و رها کردن بین رانندگان جابجا کنید</p>
          </div>
          <div className='flex items-center gap-3 me-4'>
            <Button
              type='button'
              onClick={() => loadRoutes(true)}
              disabled={loading}
              className='bg-primary text-primary-foreground'
            >
              {loading ? <Loader2 className='h-4 w-4 ml-2 animate-spin' /> : <Container className='h-4 w-4 ml-2' />}
              تخصیص
            </Button>

            {routes.length > 0 && (
              <Button
                onClick={() => handleConfirmEdits()}
                disabled={confirmSaving}
                className='bg-chart-2 text-white hover:bg-chart-2/90 hover:text-white dark:hover:text-white'
              >
                {confirmSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Check className='h-4 w-4' />}
              </Button>
            )}
            <Button
              onClick={handlePrint}
              className='bg-primary text-primary-foreground'
            >
              <Printer className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {!loading && ordersInRange.length > 0 && (
        <Card className='bg-card border-border mb-4 no-print'>
          <CardHeader className='py-3 flex justify-between'>
            <div>
              <CardTitle className='text-base text-foreground'>مرسولات تخصیص‌نشده در این بازه</CardTitle>
              <p className='text-sm '>{ordersInRange.length} مرسوله</p>
            </div>
          </CardHeader>
          <CardContent className='p-0 max-h-[320px] overflow-y-auto'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50 hover:bg-muted/50'>
                  <TableHead className='text-right text-foreground'> ردیف</TableHead>
                  <TableHead className='text-right text-foreground'>نام مقصد</TableHead>
                  <TableHead className='text-right text-foreground'>آدرس</TableHead>
                  <TableHead className='text-right text-foreground'>تحویل دهنده</TableHead>
                  <TableHead className='text-right text-foreground'>موبایل</TableHead>
                  <TableHead className='text-right text-foreground'>زمان دریافت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersInRange.map((order, index) => (
                  <TableRow
                    key={order.id}
                    className='hover:bg-muted/30'
                  >
                    <TableCell className=' text-sm'>{index + 1}</TableCell>
                    <TableCell className='text-foreground max-w-[240px] truncate text-sm'>
                      {order.locationName}
                    </TableCell>
                    <TableCell className='text-foreground max-w-[240px] truncate text-sm'>{order.address}</TableCell>
                    <TableCell className='text-foreground max-w-[240px] truncate text-sm'>
                      {order.contactPerson ?? 'ناموجود'}
                    </TableCell>
                    <TableCell className='text-foreground max-w-[240px] truncate text-sm'>
                      {order.mobile ?? 'ناموجود'}
                    </TableCell>
                    <TableCell className=' text-sm whitespace-nowrap'>
                      <DateCell date={order.returnTime ?? order.deliveryTime} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className='flex items-center justify-center py-16'>
          <div className=''>در حال بارگذاری...</div>
        </div>
      ) : routes.length === 0 ? (
        <Card className='bg-card border-border no-print'>
          <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='rounded-full bg-muted p-4 mb-4'>
              <Eye className='h-8 w-8 ' />
            </div>
            <h3 className='text-lg font-medium text-foreground'>مسیری یافت نشد</h3>
            <p className='text-sm  mt-1'>پس از بهینه‌سازی، مسیرهای دریافت در اینجا نمایش داده می‌شوند.</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className='grid gap-4 sm:grid-cols-2 2xl:grid-cols-3 no-print'>
            {routes.map((route) => (
              <DriverSlip
                key={route.id}
                route={route}
                orders={route.orders}
              />
            ))}
          </div>
          <DragOverlay>
            {activeOrder ? (
              <div className='flex items-center gap-3 p-2 rounded-lg border border-primary bg-card shadow-lg'>
                <div className='flex items-center justify-center w-6 h-6 '>
                  <GripVertical className='h-4 w-4' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-mono text-primary truncate'>{activeOrder.id}</p>
                  <p className='text-xs  truncate'>{activeOrder.address}</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Print View */}
      <ReceivePrintView routes={routes} />
    </DashboardLayout>
  );
}
