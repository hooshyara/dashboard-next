'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { PersianDatePicker } from '@/components/ui/persian-calendar';
import { Filter } from 'lucide-react';
import { Driver, Location, LogAction } from '@/lib/types';

const ACTION_LABELS: Record<LogAction, string> = {
  CREATE_ORDER: 'ایجاد سفارش',
  UPDATE_ORDER: 'به‌روزرسانی سفارش',
  DELETE_ORDER: 'حذف سفارش',
  ASSIGN_DRIVER: 'تخصیص راننده',
  CREATE_DRIVER: 'ایجاد راننده',
  UPDATE_DRIVER: 'به‌روزرسانی راننده',
  DELETE_DRIVER: 'حذف راننده',
  CREATE_USER: 'ایجاد کاربر',
  UPDATE_USER: 'به‌روزرسانی کاربر',
  DELETE_USER: 'حذف کاربر',
};

export interface LogsFilters {
  user: string;
  action: LogAction | 'all';
  startDate: Date | null;
  endDate: Date | null;
}

interface LogsFiltersProps {
  uniqueUsers: string[];
  filters: LogsFilters;
  onChange: (filters: LogsFilters) => void;
  onFilter: () => void;
  onClear: () => void;
  isDrawer?: boolean;
  className?: string;
}

export function LogsFilter({
  uniqueUsers,
  filters,
  onChange,
  onFilter,
  onClear,
  isDrawer,
  className,
}: LogsFiltersProps) {
  const hasFilters = filters.user !== 'all' || filters.action !== 'all' || filters.startDate || filters.endDate;

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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* User Filter */}
          <div className='grid gap-2'>
            <Label className='text-foreground text-sm'>کاربر</Label>
            <Select
              value={filters.user}
              onValueChange={(value) => onChange({ ...filters, user: value })}
            >
              <SelectTrigger className='bg-secondary border-border text-foreground w-full'>
                <SelectValue placeholder='همه کاربران' />
              </SelectTrigger>
              <SelectContent className='bg-card border-border'>
                <SelectItem
                  value='all'
                  className='text-foreground'
                >
                  همه کاربران
                </SelectItem>
                {uniqueUsers?.map((user) => (
                  <SelectItem
                    key={user}
                    value={user}
                    className='text-foreground'
                  >
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Filter */}
          <div className='grid gap-2'>
            <Label className='text-foreground text-sm'>عملیات</Label>
            <Select
              value={filters.action}
              onValueChange={(value) => onChange({ ...filters, action: value as LogAction | 'all' })}
            >
              <SelectTrigger className='bg-secondary border-border text-foreground w-full'>
                <SelectValue placeholder='همه عملیات‌ها' />
              </SelectTrigger>
              <SelectContent className='bg-card border-border'>
                <SelectItem
                  value='all'
                  className='text-foreground'
                >
                  همه عملیات‌ها
                </SelectItem>
                {(Object.keys(ACTION_LABELS) as LogAction[]).map((action) => (
                  <SelectItem
                    key={action}
                    value={action}
                    className='text-foreground'
                  >
                    {ACTION_LABELS[action]}
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

const LogsFilterContainer = (props: LogsFiltersProps) => {
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

          <LogsFilter
            {...props}
            className='bg-transparent border-none'
          />
        </DrawerContent>
      </Drawer>
    );
  }
  return <LogsFilter {...props} />;
};

export default LogsFilterContainer;
