'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Package, TrendingUp, ShoppingBag, Banknote } from 'lucide-react';
import { fetchOrdersByTimeRange } from '@/lib/services';
import { Order } from '@/lib/types';
import {
  aggregateRangeStats,
  buildRanges,
  formatToman,
  RangeStat,
  topProducts,
  ProductStat,
} from '@/lib/analytics';

const countConfig = {
  count: { label: 'تعداد سفارش', color: 'var(--chart-1)' },
};

const revenueConfig = {
  revenue: { label: 'درآمد (تومان)', color: 'var(--chart-2)' },
};

const productConfig = {
  count: { label: 'تعداد فروش', color: 'var(--chart-3)' },
};

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const now = new Date();
        // از ابتدای سال جاری تا امروز را یک‌بار می‌گیریم و سمت کلاینت تجمیع می‌کنیم
        const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        // ماه قبل ممکن است پیش از ابتدای سال نباشد، اما برای اطمینان از پوشش، یک ماه عقب‌تر شروع می‌کنیم
        const start = new Date(yearStart);
        start.setMonth(start.getMonth() - 1);

        const list = await fetchOrdersByTimeRange(start, end);
        if (!cancelled) setOrders(list);
      } catch (err) {
        console.error(err);
        if (!cancelled) setOrders([]);
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
  const rangeStats: RangeStat[] = useMemo(() => aggregateRangeStats(orders, ranges), [orders, ranges]);
  const products: ProductStat[] = useMemo(() => topProducts(orders, 5), [orders]);

  const totalRevenue = useMemo(
    () => rangeStats.find((r) => r.key === 'year')?.revenue ?? 0,
    [rangeStats]
  );
  const totalOrders = useMemo(
    () => rangeStats.find((r) => r.key === 'year')?.count ?? 0,
    [rangeStats]
  );
  const todayCount = rangeStats.find((r) => r.key === 'today')?.count ?? 0;
  const monthRevenue = rangeStats.find((r) => r.key === 'month')?.revenue ?? 0;

  const summaryCards = [
    { title: 'سفارش امروز', value: loading ? '...' : todayCount.toString(), icon: Package, color: 'text-primary' },
    { title: 'سفارش امسال', value: loading ? '...' : totalOrders.toString(), icon: ShoppingBag, color: 'text-chart-2' },
    { title: 'درآمد این ماه', value: loading ? '...' : formatToman(monthRevenue), icon: Banknote, color: 'text-chart-3' },
    { title: 'درآمد امسال', value: loading ? '...' : formatToman(totalRevenue), icon: TrendingUp, color: 'text-success' },
  ];

  return (
    <div className="space-y-4">
      {/* کارت‌های خلاصه */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground text-balance">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* نمودار تعداد فروش بر اساس بازه */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">تعداد فروش بر اساس بازهٔ زمانی</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">در حال بارگذاری...</div>
            ) : (
              <ChartContainer config={countConfig} className="h-[280px] w-full">
                <BarChart data={rangeStats} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* نمودار درآمد بر اساس بازه */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">درآمد بر اساس بازهٔ زمانی</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">در حال بارگذاری...</div>
            ) : (
              <ChartContainer config={revenueConfig} className="h-[280px] w-full">
                <BarChart data={rangeStats} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(v) => new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(v)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatToman(Number(value))} />}
                  />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* پنج محصول پرفروش */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">پنج محصول پرفروش</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">در حال بارگذاری...</div>
          ) : products.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              داده‌ای برای نمایش وجود ندارد. (کد محصول ثبت نشده است)
            </div>
          ) : (
            <ChartContainer config={productConfig} className="h-[300px] w-full">
              <BarChart data={products} layout="vertical" accessibilityLayer margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="product"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {products.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
