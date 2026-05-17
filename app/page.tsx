'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, Truck, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fetchOrdersByTimeRange,
  getActiveDrivers,
} from '@/lib/services';
import { Driver, Order, OrderStatus, getDisplayedOrderDriver, ORDER_STATUS_LABEL_FA } from '@/lib/types';

export default function DashboardPage() {
  const [activeDrivers, setActiveDrivers] = useState<Driver[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0
        );
        const todayEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        const threeDayStart = new Date(todayStart);
        threeDayStart.setDate(threeDayStart.getDate() - 2);

        const [activeList, todayList, lastThreeDays] = await Promise.all([
          getActiveDrivers(),
          fetchOrdersByTimeRange(todayStart, todayEnd),
          fetchOrdersByTimeRange(threeDayStart, todayEnd),
        ]);

        if (cancelled) return;

        setActiveDrivers(activeList);
        setTodayOrders(todayList);

        const sortedRecent = [...lastThreeDays].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        setRecentOrders(sortedRecent.slice(0, 5));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setActiveDrivers([]);
          setTodayOrders([]);
          setRecentOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingOrders = todayOrders.filter((o) => o.status === OrderStatus.PENDING).length;
  const assignedOrders = todayOrders.filter((o) => o.status === OrderStatus.ASSIGNED).length;

  const stats = [
    {
      title: 'رانندگان فعال',
      value: loading ? '...' : activeDrivers.length.toString(),
      icon: Users,
      change: '+۲ این ماه',
      color: 'text-primary',
    },
    {
      title: 'سفارشات امروز',
      value: loading ? '...' : todayOrders.length.toString(),
      icon: Package,
      change: '+۱۲ از دیروز',
      color: 'text-chart-2',
    },
    {
      title: 'در حال ارسال',
      value: loading ? '...' : assignedOrders.toString(),
      icon: Truck,
      change: `${pendingOrders} تخصیص داده نشده`,
      color: 'text-chart-3',
    },
    {
      title: 'نرخ تحویل',
      value: '۹۸٪',
      icon: TrendingUp,
      change: '+۲٪ این هفته',
      color: 'text-success',
    },
  ];

  return (
    <DashboardLayout title="داشبورد">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">سفارشات اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">در حال بارگذاری...</div>
              ) : recentOrders.length === 0 ? (
                <div className="text-muted-foreground">سفارشی در سه روز اخیر نیست.</div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => {
                    const displayedDriver = getDisplayedOrderDriver(order);
                    const statusClass =
                      order.status === OrderStatus.ASSIGNED
                        ? 'bg-success/20 text-success'
                        : order.status === OrderStatus.CANCEL
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-warning/20 text-warning';
                    return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-sm text-primary">
                          {order.trackingCode}
                        </span>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {order.address}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${statusClass}`}
                        >
                          {ORDER_STATUS_LABEL_FA[order.status]}
                        </span>
                        {displayedDriver && (
                          <span className="text-xs text-muted-foreground">
                            {displayedDriver.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {order.contactPerson}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Drivers */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">رانندگان فعال</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">در حال بارگذاری...</div>
              ) : activeDrivers.length === 0 ? (
                <div className="text-muted-foreground">رانندهٔ فعالی ثبت نشده است.</div>
              ) : (
                <div className="space-y-4">
                  {activeDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">
                          {driver.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {driver.car}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-foreground">
                          ظرفیت: {driver.capacity}
                        </span>
                        <span className="text-xs text-success">آنلاین</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
