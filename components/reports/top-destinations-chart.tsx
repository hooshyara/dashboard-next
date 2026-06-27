'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { getTopFamousPlaces } from '@/lib/services';
import type { TopFamousPlace } from '@/lib/types';

const chartConfig = {
  ordersCount: {
    label: 'تعداد سفارشات',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export default function TopDestinationsChart({ limit = 10 }: { limit?: number }) {
  const [data, setData] = useState<TopFamousPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const places = await getTopFamousPlaces(limit);
      setData(places);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return (
    <Card className='bg-card border-border mb-4'>
      <CardHeader>
        <CardTitle className='text-foreground flex items-center gap-2'>
          <MapPin className='h-5 w-5' />
          پرتکرارترین مقاصد بر اساس تعداد سفارش
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='flex items-center gap-3'
              >
                <Skeleton className='h-4 w-24 shrink-0' />
                <Skeleton
                  className='h-7 flex-1'
                  style={{ maxWidth: `${90 - i * 12}%` }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <AlertCircle className='h-12 w-12 mb-4 text-destructive opacity-70' />
            <p className='text-foreground'>خطا در دریافت اطلاعات مقاصد</p>
            <p className='text-sm text-muted-foreground mb-4'>لطفاً دوباره تلاش کنید</p>
            <Button
              onClick={load}
              variant='outline'
              className='border-border'
            >
              <RefreshCw className='h-4 w-4 ml-2' />
              تلاش مجدد
            </Button>
          </div>
        ) : data.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center text-muted-foreground'>
            <MapPin className='h-12 w-12 mb-4 opacity-50' />
            <p>داده‌ای برای نمایش وجود ندارد</p>
            <p className='text-sm'>هنوز سفارشی برای مقاصد ثبت نشده است</p>
          </div>
        ) : (
          <div className='w-full overflow-x-auto'>
            <div className='min-w-[320px]'>
              <ChartContainer
                config={chartConfig}
                className='h-[320px] sm:h-[400px] w-full'
              >
                <BarChart
                  data={data}
                  layout='vertical'
                  accessibilityLayer
                  margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray='3 3' />
                  <XAxis
                    type='number'
                    dataKey='ordersCount'
                    orientation='top'
                    reversed
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    orientation='right'
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey='ordersCount'
                    name='تعداد سفارشات'
                    radius={[6, 0, 0, 6]}
                  >
                    {data.map((_, i) => (
                      <Cell
                        key={i}
                        fill={`var(--chart-${(i % 5) + 1})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
