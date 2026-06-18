'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { PersianDatePicker } from '@/components/ui/persian-calendar';
import { Filter } from 'lucide-react';
import { Driver, Location } from '@/lib/types';

export interface ReportFilters {
  destination: string;
  driverId: number | null;
  locationId: number | null;
  trackingCode: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface ReportFiltersProps {
  locations: Location[];
  drivers: Driver[];
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onFilter: () => void;
  onClear: () => void;
  isDrawer?: boolean;
  className?: string;
}

export function ReportsFilter({
  locations,
  drivers,
  filters,
  onChange,
  onFilter,
  onClear,
  isDrawer,
  className,
}: ReportFiltersProps) {
  const hasFilters =
    filters.destination ||
    filters.driverId ||
    filters.locationId ||
    filters.trackingCode ||
    filters.startDate ||
    filters.endDate;

  return (
    <Card className={`bg-card border-border mb-4 overflow-auto ${className}`}>
      {!isDrawer ? (
        <CardHeader className='pb-3'>
          <CardTitle className='text-base text-foreground flex items-center gap-2'>
            <Filter className='h-4 w-4' />
            فیلتر گزارش
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
          {/* Destination Filter - only for orders */}
          <div className='grid gap-2'>
            <Label
              htmlFor='destination'
              className='text-foreground text-sm'
            >
              مقصد (متن)
            </Label>
            <Input
              id='destination'
              value={filters.destination}
              onChange={(e) => onChange({ ...filters, destination: e.target.value })}
              placeholder='نام مقصد...'
              className='bg-secondary border-border text-foreground w-full sm:w-auto'
            />
          </div>

          {/* Location Filter */}
          <div className='grid gap-2 w-full'>
            <Label className='text-foreground text-sm'>مقصد (لیست)</Label>
            <Select
              value={filters.locationId?.toString() || 'all'}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  locationId: value === 'all' ? null : parseInt(value),
                })
              }
            >
              <SelectTrigger className='bg-secondary border-border text-foreground w-full sm:w-auto'>
                <SelectValue placeholder='همه مقاصد' />
              </SelectTrigger>
              <SelectContent className='bg-card border-border'>
                <SelectItem
                  value='all'
                  className='text-foreground'
                >
                  همه مقاصد
                </SelectItem>
                {locations.map((location) => (
                  <SelectItem
                    key={location.id}
                    value={location.id.toString()}
                    className='text-foreground'
                  >
                    {location.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Driver Filter */}
          <div className='grid gap-2'>
            <Label className='text-foreground text-sm'>راننده</Label>
            <Select
              value={filters.driverId?.toString() || 'all'}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  driverId: value === 'all' ? null : parseInt(value),
                })
              }
            >
              <SelectTrigger className='bg-secondary border-border text-foreground w-full sm:w-auto'>
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

          {/* Tracking Code Filter - only for orders */}
          <div className='grid gap-2'>
            <Label
              htmlFor='trackingCode'
              className='text-foreground text-sm'
            >
              کد پیگیری
            </Label>
            <Input
              id='trackingCode'
              value={filters.trackingCode}
              onChange={(e) => onChange({ ...filters, trackingCode: e.target.value })}
              placeholder='FLW-...'
              className='bg-secondary border-border text-foreground w-full sm:w-auto'
            />
          </div>

          {/* Start Date Filter */}
          <div className='grid gap-2'>
            <Label className='text-foreground text-sm'>از تاریخ</Label>
            <PersianDatePicker
              value={filters.startDate || undefined}
              onChange={(date) => onChange({ ...filters, startDate: date || null })}
              placeholder='انتخاب تاریخ'
              showTimePicker
            />
          </div>

          {/* End Date Filter */}
          <div className='grid gap-2'>
            <Label className='text-foreground text-sm'>تا تاریخ</Label>
            <PersianDatePicker
              value={filters.endDate || undefined}
              onChange={(date) => onChange({ ...filters, endDate: date || null })}
              placeholder='انتخاب تاریخ'
              showTimePicker
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className='flex flex-col md:flex-row gap-2 mt-4'>
          <Button
            onClick={async () => await onFilter()}
            className='bg-primary text-primary-foreground'
          >
            <Filter className='h-4 w-4 ml-2' />
            اعمال فیلتر
          </Button>
          {hasFilters && (
            <Button
              variant='outline'
              onClick={async () => onClear()}
              className='border-border'
            >
              پاک کردن
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const ReportsFilterContainer = (props: ReportFiltersProps) => {
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
              فیلتر گزارش
            </DrawerTitle>
          </DrawerHeader>

          <ReportsFilter
            {...props}
            className='bg-transparent border-none'
          />
        </DrawerContent>
      </Drawer>
    );
  }
  return <ReportsFilter {...props} />;
};

export default ReportsFilterContainer;
