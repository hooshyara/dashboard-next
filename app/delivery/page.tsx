'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { PrintView } from '@/components/delivery/print-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PersianDatePicker } from '@/components/ui/persian-calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Printer, Eye, LayoutGrid, List, RefreshCw, GripVertical, Check, Loader2, CalendarRange } from 'lucide-react';
import { DeliveryRoute, Order } from '@/lib/types';
import {
  buildDeliveryRouteAssignmentPayload,
  defaultOptimizerTimeRange,
  deliveryRouteAssignmentsEqual,
  getDeliveryRoutes,
  saveDeliveryRouteAssignments,
  type DeliveryRouteAssignmentPayload,
} from '@/lib/services';
import { format } from 'date-fns-jalali';

export default function DeliveryPage() {
  const initialRange = defaultOptimizerTimeRange();
  const [rangeStart, setRangeStart] = useState<Date | null>(initialRange.start);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialRange.end);
  const [ordersInRange, setOrdersInRange] = useState<Order[]>([]);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [committedAssignments, setCommittedAssignments] =
    useState<DeliveryRouteAssignmentPayload | null>(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
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
      const { orders: sorted, routes: routeData } = await getDeliveryRoutes({
        start: rangeStart,
        end: rangeEnd,
      });
      setRoutes(routeData);
      setOrdersInRange(sorted);
      setCommittedAssignments(buildDeliveryRouteAssignmentPayload(routeData));
    } catch (e) {
      console.error(e);
      setRoutes([]);
      setOrdersInRange([]);
      setRangeError('خطا در بارگذاری داده‌ها. اتصال به سرور را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  }

  const pendingEdits = useMemo(() => {
    if (!committedAssignments) return false;
    return !deliveryRouteAssignmentsEqual(
      buildDeliveryRouteAssignmentPayload(routes),
      committedAssignments
    );
  }, [routes, committedAssignments]);

  async function handleConfirmEdits() {
    const payload = buildDeliveryRouteAssignmentPayload(routes);
    setConfirmSaving(true);
    try {
      await saveDeliveryRouteAssignments(payload);
      setCommittedAssignments(payload);
    } finally {
      setConfirmSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDragStart(event: DragStartEvent) {
    const orderId = event.active.id as number;
    // Find the order being dragged
    for (const route of routes) {
      const order = route.orders.find((o) => o.id === orderId);
      if (order) {
        setActiveOrder(order);
        break;
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    // Optional: Add visual feedback during drag over
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
        overData?.routeId ??
        prevRoutes.find((route) => route.orders.some((order) => order.id === overId))?.id;
      if (!targetRouteId) return prevRoutes;

      const sourceRouteIndex = prevRoutes.findIndex((route) =>
        route.orders.some((order) => order.id === orderId)
      );
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
          index === sourceRouteIndex ? { ...route, orders: reorderedOrders } : route
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
    <DashboardLayout title="لیست ارسال">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6 no-print">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تعداد مسیرها</p>
                <p className="text-2xl font-bold text-foreground">{routes.length}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <LayoutGrid className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">سفارشات در مسیرها</p>
                <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  در بازهٔ انتخاب‌شده (API): {ordersInRange.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-chart-2/20">
                <List className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ظرفیت کل</p>
                <p className="text-2xl font-bold text-foreground">{totalCapacity}</p>
              </div>
              <div className="p-3 rounded-full bg-chart-3/20">
                <RefreshCw className="h-5 w-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بازهٔ زمانی: POST orders/time با start و end (ISO) */}
      <Card className="bg-card border-border mb-6 no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            بازهٔ زمانی سفارشات
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            با دکمهٔ زیر سفارشات از <code className="text-xs bg-muted px-1 rounded">orders/time</code> با
            فیلدهای <code className="text-xs bg-muted px-1 rounded">start</code> و{' '}
            <code className="text-xs bg-muted px-1 rounded">end</code> گرفته می‌شوند؛ فقط سفارش‌های با
            وضعیت «تخصیص داده نشده» برای بهینه‌ساز و نمایش در این صفحه استفاده می‌شوند.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-foreground">شروع (start)</Label>
              <PersianDatePicker
                value={rangeStart || undefined}
                onChange={(d) => setRangeStart(d ?? null)}
                placeholder="تاریخ و ساعت شروع"
                showTimePicker
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-foreground">پایان (end)</Label>
              <PersianDatePicker
                value={rangeEnd || undefined}
                onChange={(d) => setRangeEnd(d ?? null)}
                placeholder="تاریخ و ساعت پایان"
                showTimePicker
              />
            </div>
          </div>
          {rangeError && (
            <p className="text-sm text-destructive" role="alert">
              {rangeError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void loadRoutes()}
              disabled={loading}
              className="bg-primary text-primary-foreground"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <CalendarRange className="h-4 w-4 ml-2" />
              )}
              اعمال بازه و بارگذاری
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => {
                const r = defaultOptimizerTimeRange();
                setRangeStart(r.start);
                setRangeEnd(r.end);
              }}
            >
              پیش‌فرض (۷ روز)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <Card className="bg-card border-border mb-6 no-print">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-foreground">مسیرهای ارسال</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              سفارشات را با کشیدن و رها کردن بین رانندگان جابجا کنید
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'bg-primary text-primary-foreground' : ''}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-primary text-primary-foreground' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => void loadRoutes()}
              disabled={loading}
              className="border-border"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </Button>
            {routes.length > 0 && (
              <Button
                onClick={() => void handleConfirmEdits()}
                disabled={confirmSaving}
                className="bg-chart-2 text-white hover:bg-chart-2/90 hover:text-white dark:hover:text-white"
              >
                {confirmSaving ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 ml-2" />
                )}
                {pendingEdits ? 'تأیید ویرایش' : 'تأیید و ذخیره تخصیص'}
              </Button>
            )}
            <Button onClick={handlePrint} className="bg-primary text-primary-foreground">
              <Printer className="h-4 w-4 ml-2" />
              چاپ همه
            </Button>
          </div>
        </CardHeader>
      </Card>

      {!loading && ordersInRange.length > 0 && (
        <Card className="bg-card border-border mb-6 no-print">
          <CardHeader className="py-3">
            <CardTitle className="text-base text-foreground">
              سفارشات تخصیص‌نشده در این بازه
            </CardTitle>
            <p className="text-sm text-muted-foreground">{ordersInRange.length} سفارش</p>
          </CardHeader>
          <CardContent className="p-0 max-h-[320px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-right text-foreground w-12">#</TableHead>
                  <TableHead className="text-right text-foreground">کد پیگیری</TableHead>
                  <TableHead className="text-right text-foreground">آدرس</TableHead>
                  <TableHead className="text-right text-foreground">زمان تحویل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersInRange.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm text-primary">{order.trackingCode}</TableCell>
                    <TableCell className="text-foreground max-w-[240px] truncate text-sm">
                      {order.address}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {format(new Date(order.deliveryTime), 'yyyy/MM/dd HH:mm')}
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
        <div className="flex items-center justify-center py-16">
          <div className="text-muted-foreground">در حال بارگذاری...</div>
        </div>
      ) : routes.length === 0 ? (
        <Card className="bg-card border-border no-print">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">مسیری یافت نشد</h3>
            <p className="text-sm text-muted-foreground mt-1">
              پس از بهینه‌سازی، مسیرهای ارسال در اینجا نمایش داده می‌شوند.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 no-print">
            {routes.map((route) => (
              <DriverSlip key={route.id} route={route} orders={route.orders} />
            ))}
          </div>
          <DragOverlay>
            {activeOrder ? (
              <div className="flex items-center gap-3 p-2 rounded-lg border border-primary bg-card shadow-lg">
                <div className="flex items-center justify-center w-6 h-6 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-primary truncate">
                    {activeOrder.trackingCode}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeOrder.address}
                  </p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card className="bg-card border-border no-print">
          <CardContent className="p-0">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-right text-foreground">مسیر</TableHead>
                    <TableHead className="text-right text-foreground">راننده</TableHead>
                    <TableHead className="text-right text-foreground">سفارشات</TableHead>
                    <TableHead className="text-right text-foreground">ظرفیت</TableHead>
                    <TableHead className="text-right text-foreground">بازه زمانی</TableHead>
                    <TableHead className="text-right text-foreground">ترتیب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {route.routeName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div>
                          <p className="font-medium">{route.driver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {route.driver.car}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {route.orders.length}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {route.totalCapacity} / {route.driver.capacity}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(route.timeWindow.start), 'HH:mm')} -{' '}
                        {format(new Date(route.timeWindow.end), 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {route.deliverySequence.map((seq, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs text-foreground"
                            >
                              {seq}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print View - Hidden on screen, visible when printing */}
      <PrintView routes={routes} />
    </DashboardLayout>
  );
}
