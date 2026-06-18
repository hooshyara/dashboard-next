"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  Package,
  ShoppingBag,
  Banknote,
  Users,
  TrendingUp,
} from "lucide-react";
import { fetchOrdersByTimeRange, getActiveDrivers } from "@/lib/services";
import { Driver, Order } from "@/lib/types";
import {
  aggregateRangeStats,
  buildRanges,
  formatToman,
  RangeStat,
  topProducts,
  ProductStat,
} from "@/lib/analytics";

const countConfig = {
  count: { label: "تعداد سفارش", color: "var(--chart-1)" },
};

const productConfig = {
  count: { label: "تعداد فروش", color: "var(--chart-3)" },
};

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        const start = new Date(yearStart);
        start.setMonth(start.getMonth() - 1);

        const [list, drivers] = await Promise.all([
          fetchOrdersByTimeRange(start, end),
          getActiveDrivers(),
        ]);
        if (!cancelled) {
          setOrders(list);
          setActiveDrivers(drivers);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setOrders([]);
          setActiveDrivers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ranges = useMemo(() => buildRanges(), []);
  const rangeStats: RangeStat[] = useMemo(
    () => aggregateRangeStats(orders, ranges),
    [orders, ranges],
  );
  const products: ProductStat[] = useMemo(
    () => topProducts(orders, 5),
    [orders],
  );

  const totalOrders = useMemo(
    () => rangeStats.find((r) => r.key === "year")?.count ?? 0,
    [rangeStats],
  );
  const todayCount = rangeStats.find((r) => r.key === "today")?.count ?? 0;
  const monthRevenue = rangeStats.find((r) => r.key === "month")?.revenue ?? 0;

  const summaryCards = [
    {
      title: "رانندگان فعال",
      value: loading ? "..." : activeDrivers.length.toString(),
      icon: Users,
      color: "text-primary",
    },
    {
      title: "سفارش امروز",
      value: loading ? "..." : todayCount.toString(),
      icon: Package,
      color: "text-chart-2",
    },
    {
      title: "سفارش امسال",
      value: loading ? "..." : totalOrders.toString(),
      icon: ShoppingBag,
      color: "text-chart-3",
    },
    {
      title: "درآمد این ماه",
      value: loading ? "..." : formatToman(monthRevenue),
      icon: Banknote,
      color: "text-success",
    },
  ];

  // پیدا کردن بیشترین تعداد فروش برای نمایش درصد
  const maxCount =
    products.length > 0 ? Math.max(...products.map((p) => p.count)) : 1;

  return (
    <div className="space-y-4 px-2 sm:px-4">
      {/* کارت‌های خلاصه - در موبایل ۲ به ۲ کنار هم */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-2 sm:px-6 pt-2 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-foreground/80 sm:text-foreground">
                {c.title}
              </CardTitle>
              <c.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${c.color}`} />
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-2 sm:pb-6">
              <div className="text-sm sm:text-2xl font-bold text-foreground text-balance truncate">
                {c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* نمودار تعداد فروش بر اساس بازه */}
        <Card className="bg-card border-border">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-foreground">
              تعداد فروش بر اساس بازهٔ زمانی
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
            {loading ? (
              <div className="h-[240px] sm:h-[280px] flex items-center justify-center text-muted-foreground">
                در حال بارگذاری...
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[300px] sm:min-w-0">
                  <ChartContainer
                    config={countConfig}
                    className="h-[240px] sm:h-[280px] w-full"
                  >
                    <BarChart
                      data={rangeStats}
                      accessibilityLayer
                      margin={{ left: 0, right: 0, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={32}
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* رانندگان فعال */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-foreground">
              رانندگان فعال
            </CardTitle>
            <span className="text-sm font-medium text-primary">
              {loading ? "..." : `${activeDrivers.length} راننده`}
            </span>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
            {loading ? (
              <div className="h-[240px] sm:h-[280px] flex items-center justify-center text-muted-foreground">
                در حال بارگذاری...
              </div>
            ) : activeDrivers.length === 0 ? (
              <div className="h-[240px] sm:h-[280px] flex items-center justify-center text-muted-foreground">
                رانندهٔ فعالی ثبت نشده است.
              </div>
            ) : (
              <div className="h-[240px] sm:h-[280px] overflow-y-auto space-y-3 pe-1">
                {activeDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0 gap-2 sm:gap-0"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground text-sm sm:text-base">
                        {driver.name}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {driver.car || "—"}
                      </span>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
                      <span className="text-xs sm:text-sm text-foreground">
                        ظرفیت: {driver.capacity}
                      </span>
                      <span className="text-xs text-success whitespace-nowrap">
                        ● آنلاین
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* پنج محصول پرفروش - نسخه responsive با لیست در موبایل */}
      <Card className="bg-card border-border">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-base sm:text-lg text-foreground">
            پنج محصول پرفروش
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
          {loading ? (
            <div className="h-[280px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
              در حال بارگذاری...
            </div>
          ) : products.length === 0 ? (
            <div className="h-[280px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
              داده‌ای برای نمایش وجود ندارد. (کد گل ثبت نشده است)
            </div>
          ) : (
            <>
              {/* نسخه موبایل: نمایش به صورت لیست با نوار پیشرفت */}
              <div className="block sm:hidden space-y-4">
                {products.map((product, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className={`h-4 w-4 text-chart-${(index % 5) + 1}`}
                        />
                        <span className="font-medium text-foreground">
                          {product.product}
                        </span>
                      </div>
                      <span className="font-bold text-primary">
                        {product.count} عدد
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(product.count / maxCount) * 100}%`,
                          backgroundColor: `var(--chart-${(index % 5) + 1})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* نسخه تبلت و دسکتاپ: نمایش نمودار */}
              <div className="hidden sm:block w-full overflow-x-auto">
                <div className="min-w-[400px]">
                  <ChartContainer
                    config={productConfig}
                    className="h-[300px] w-full"
                  >
                    <BarChart
                      data={products}
                      layout="vertical"
                      accessibilityLayer
                      margin={{ left: 80, right: 10, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="product"
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {products.map((_, i) => (
                          <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
