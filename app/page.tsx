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
import { useAuth } from '@/components/auth/auth-provider';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [activeDrivers, setActiveDrivers] = useState<Driver[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [toYearOrders, setToYearOrders] = useState<Order[]>([]);
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
        
        const oneYearAgo = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0
        );

        const [activeList, todayList, lastThreeDays, yearlyOrders] = await Promise.all([
          getActiveDrivers(),
          fetchOrdersByTimeRange(todayStart, todayEnd),
          fetchOrdersByTimeRange(threeDayStart, todayEnd),
          fetchOrdersByTimeRange(oneYearAgo, todayEnd),
        ]);

        if (cancelled) return;

        setActiveDrivers(activeList);
        setTodayOrders(todayList);
        setToYearOrders(yearlyOrders);

        const sortedRecent = [...lastThreeDays].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        setRecentOrders(sortedRecent.slice(0, 5));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setActiveDrivers([]);
          setTodayOrders([]);
          setToYearOrders([]);
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
      change: 'این ماه',
      color: 'text-primary',
    },
    {
      title: 'سفارشات امروز',
      value: loading ? '...' : todayOrders.length.toString(),
      icon: Package,
      change: 'از دیروز',
      color: 'text-chart-2',
    },
    {
      title: 'در حال ارسال',
      value: loading ? '...' : pendingOrders,
      icon: Truck,
      change: `تخصیص داده نشده`,
      color: 'text-chart-3',
    },
    {
      title: 'سفارشات یک سال اخیر',
      value: loading ? '...' : toYearOrders.length.toString(),
      icon: TrendingUp,
      change: 'نسبت به سال قبل',
      color: 'text-success',
    },
  ];

  return (
    <DashboardLayout title="داشبورد">
      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <div className="space-y-4">
        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium ">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs mt-1">{stat.change}</p>
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
                <div className="">در حال بارگذاری...</div>
              ) : recentOrders.length === 0 ? (
                <div className="">سفارشی در سه روز اخیر نیست.</div>
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
                          {order.id}
                        </span>
                        <span className="text-sm truncate max-w-[200px]">
                          {order.address}
                        </span>
                      </div>
                      <div className="flex flex-col gap-6 items-end sm:gap-4">
                        <span
                          className={`text-xs px-2 text-center py-1 rounded-full ${statusClass}`}
                        >
                          {ORDER_STATUS_LABEL_FA[order.status]}
                        </span>
                        {displayedDriver && (
                          <span className="text-xs">
                            {displayedDriver.name}
                          </span>
                        )}
                        <span className="text-xs">
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
                <div className="">در حال بارگذاری...</div>
              ) : activeDrivers.length === 0 ? (
                <div className="">رانندهٔ فعالی ثبت نشده است.</div>
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
                        <span className="text-sm">
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
      )}
    </DashboardLayout>
  );
}
