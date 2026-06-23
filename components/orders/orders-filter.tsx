'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { PersianDatePicker } from '@/components/ui/persian-calendar';
import { Filter, X } from 'lucide-react';
import { Driver } from '@/lib/types';

export interface OrdersFilterValues {
  placeId: string;
  driverId: number | null;
  trackingCode: string | number;
  startDate: Date | null;
  endDate: Date | null;
}

interface OrdersFilterProps {
  drivers: Driver[];
  onFilter: (filters: OrdersFilterValues) => void;
  onClear: () => void;
  isDrawer?: boolean;
  className?: string;
}

export function OrdersFilter({ drivers, onFilter, onClear, isDrawer, className }: OrdersFilterProps) {
  const [filters, setFilters] = useState<OrdersFilterValues>({
    placeId: '',
    driverId: null,
    trackingCode: '',
    startDate: null,
    endDate: null,
  });

  const handleFilter = () => {
    onFilter(filters);
  };

  const handleClear = () => {
    setFilters({
      placeId: '',
      driverId: null,
      trackingCode: '',
      startDate: null,
      endDate: null,
    });
    onClear();
  };

  const hasFilters =
    filters.placeId || filters.driverId || filters.trackingCode || filters.startDate || filters.endDate;

  return (
    <Card className={`bg-card border-border mb-4 ${className}`}>
      {!isDrawer ? (
        <CardHeader className='pb-3'>
          <CardTitle className='text-base text-foreground flex items-center gap-2'>
            <Filter className='h-4 w-4' />
            فیلتر سفارشات
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {/* placeId Filter */}
          <div className='grid gap-2'>
            <Label
              htmlFor='placeId'
              className='text-foreground text-sm'
            >
              مقصد
            </Label>
            <Input
              id='placeId'
              value={filters.placeId}
              onChange={(e) => setFilters({ ...filters, placeId: e.target.value })}
              placeholder='نام مقصد...'
              className='bg-secondary border-border text-foreground'
            />
          </div>

          {/* Driver Filter */}
          <div className='grid gap-2'>
            <Label className='text-foreground text-sm'>راننده</Label>
            <Select
              value={filters.driverId?.toString() || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  driverId: value === 'all' ? null : parseInt(value),
                })
              }
            >
              <SelectTrigger
                dir='rtl'
                className='bg-secondary border-border text-foreground text-right w-full'
              >
                <SelectValue placeholder='همه رانندگان' />
              </SelectTrigger>
              <SelectContent className='bg-card border-border'>
                <SelectItem
                  value='all'
                  className='text-foreground'
                >
                  همه رانندگان
                </SelectItem>
                {drivers.map((driver) => (
                  <SelectItem
                    key={driver.id}
                    value={driver.id.toString()}
                    className='text-foreground'
                  >
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Filter */}
          <div className='grid gap-2'>
            <Label className='text-foreground text-sm'>از تاریخ</Label>
            <PersianDatePicker
              value={filters.startDate || undefined}
              onChange={(date) => {
                if (!date) return setFilters({ ...filters, startDate: null })
                // تنظیم ساعت شروع:
                const start = new Date(date)
                start.setHours(0, 0, 0, 0)
                setFilters({ ...filters, startDate: start })
              }}
              placeholder='انتخاب تاریخ'
              // showTimePicker
            />
          </div>

          {/* End Date Filter */}
          <div className='grid gap-2'>
            <Label className='text-foreground text-sm'>تا تاریخ</Label>
            <PersianDatePicker
              value={filters.endDate || undefined}
              onChange={(date) => {
                if (!date) return setFilters({ ...filters, endDate: null })
                // تنظیم ساعت پایان:
                const end = new Date(date)
                end.setHours(23, 59, 0, 0)
                setFilters({ ...filters, endDate: end })
              }}
              placeholder='انتخاب تاریخ'
              // showTimePicker
            />
          </div>

          {/* Filter Actions */}
          <div className='col-span-full flex flex-col md:flex-row gap-2 mt-4 w-full'>
            <Button
              onClick={handleFilter}
              className='bg-primary text-primary-foreground'
            >
              اعمال فیلتر
            </Button>
            {hasFilters && (
              <Button
                variant='outline'
                onClick={handleClear}
                className='border-border'
              >
                <X className='h-4 w-4 ml-2' />
                پاک کردن
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const OrdersFilterContainer = (props: OrdersFilterProps) => {
  if (props?.isDrawer) {
    return (
      <Drawer>
        <DrawerTrigger
          className={props?.className}
          asChild
        >
          <Button variant='ghost'>
            <Filter className='h-4 w-4' />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className='pb-3'>
            <DrawerTitle className='text-base text-foreground flex items-center gap-2'>
              <Filter className='h-4 w-4' />
              فیلتر سفارشات
            </DrawerTitle>
          </DrawerHeader>

          <OrdersFilter
            {...props}
            className='bg-transparent border-none'
          />
        </DrawerContent>
      </Drawer>
    );
  }
  return <OrdersFilter {...props} />;
};

export default OrdersFilterContainer;
