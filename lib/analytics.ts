import { Order, OrderStatus } from '@/lib/types';

export type RangeKey = 'today' | 'week' | 'month' | 'prevMonth' | 'year';

export interface RangeDef {
  key: RangeKey;
  label: string;
  start: Date;
  end: Date;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * بازه‌های زمانی تحلیل فروش: امروز، هفته، ماه، ماه قبل، سال.
 * بازه‌ها بر اساس تقویم میلادی محاسبه می‌شوند تا با Date سازگار باشند؛
 * برچسب‌ها فارسی هستند.
 */
export function buildRanges(now: Date = new Date()): RangeDef[] {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const weekStart = startOfDay(new Date(now));
  weekStart.setDate(weekStart.getDate() - 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

  return [
    { key: 'today', label: 'امروز', start: todayStart, end: todayEnd },
    { key: 'week', label: 'هفتهٔ اخیر', start: weekStart, end: todayEnd },
    { key: 'month', label: 'این ماه', start: monthStart, end: todayEnd },
    { key: 'prevMonth', label: 'ماه قبل', start: prevMonthStart, end: prevMonthEnd },
    { key: 'year', label: 'امسال', start: yearStart, end: todayEnd },
  ];
}

const CANCELLED: OrderStatus = OrderStatus.CANCEL;

function isRevenueOrder(o: Order): boolean {
  // سفارش‌های لغوشده در درآمد محاسبه نمی‌شوند
  return o.status !== CANCELLED;
}

export interface RangeStat {
  key: RangeKey;
  label: string;
  count: number;
  revenue: number;
}

/** تعداد و درآمد فروش برای هر بازهٔ زمانی */
export function aggregateRangeStats(orders: Order[], ranges: RangeDef[]): RangeStat[] {
  return ranges.map((r) => {
    const inRange = orders.filter((o) => {
      const t = o.createdAt instanceof Date ? o.createdAt.getTime() : new Date(o.createdAt).getTime();
      return t >= r.start.getTime() && t <= r.end.getTime();
    });
    const revenue = inRange.filter(isRevenueOrder).reduce((sum, o) => sum + (o.price || 0), 0);
    return { key: r.key, label: r.label, count: inRange.length, revenue };
  });
}

export interface ProductStat {
  product: string;
  count: number;
  revenue: number;
}

export interface TimeBucketStat {
  label: string;
  count: number;
  revenue: number;
}

/**
 * تجمیع تعداد سفارش بر اساس روز برای بازهٔ انتخاب‌شده.
 * برای نمودار «تعداد فروش بر اساس بازهٔ زمانی» استفاده می‌شود؛
 * ورودی، سفارش‌های بازگشتی از API بازهٔ زمانی است.
 */
export function aggregateOrdersByDay(orders: Order[]): TimeBucketStat[] {
  const map = new Map<string, TimeBucketStat>();
  const dayFormatter = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' });

  for (const o of orders) {
    const d = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = map.get(key) || { label: dayFormatter.format(d), count: 0, revenue: 0, _t: d.getTime() } as TimeBucketStat & { _t: number };
    existing.count += 1;
    if (isRevenueOrder(o)) existing.revenue += o.price || 0;
    map.set(key, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => ((a as TimeBucketStat & { _t: number })._t ?? 0) - ((b as TimeBucketStat & { _t: number })._t ?? 0))
    .map(({ label, count, revenue }) => ({ label, count, revenue }));
}

/** پنج محصول پرفروش بر اساس کد محصول */
export function topProducts(orders: Order[], limit = 5): ProductStat[] {
  const map = new Map<string, ProductStat>();
  for (const o of orders) {
    const product = (o.productCode || '').trim();
    if (!product) continue;
    const existing = map.get(product) || { product, count: 0, revenue: 0 };
    existing.count += 1;
    if (isRevenueOrder(o)) existing.revenue += o.price || 0;
    map.set(product, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** قالب‌بندی عدد به تومان با جداکنندهٔ هزارگان فارسی */
export function formatToman(value: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';
}
