'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PersianDatePicker } from '@/components/ui/persian-calendar';
import { Filter, X } from 'lucide-react';
import { Driver } from '@/lib/types';

export interface OrdersFilterValues {
  destination: string;
  driverId: number | null;
  trackingCode: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface OrdersFilterProps {
  drivers: Driver[];
  onFilter: (filters: OrdersFilterValues) => void;
  onClear: () => void;
}

export function OrdersFilter({ drivers, onFilter, onClear }: OrdersFilterProps) {
  const [filters, setFilters] = useState<OrdersFilterValues>({
    destination: '',
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
      destination: '',
      driverId: null,
      trackingCode: '',
      startDate: null,
      endDate: null,
    });
    onClear();
  };

  const hasFilters = filters.destination || filters.driverId || filters.trackingCode || filters.startDate || filters.endDate;

  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" />
          فیلتر سفارشات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Destination Filter */}
          <div className="grid gap-2">
            <Label htmlFor="destination" className="text-foreground text-sm">
              مقصد
            </Label>
            <Input
              id="destination"
              value={filters.destination}
              onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
              placeholder="نام مقصد..."
              className="bg-secondary border-border text-foreground"
            />
          </div>

          {/* Driver Filter */}
          <div className="grid gap-2">
            <Label className="text-foreground text-sm">
              راننده
            </Label>
            <Select
              value={filters.driverId?.toString() || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  driverId: value === 'all' ? null : parseInt(value),
                })
              }
            >
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue placeholder="همه رانندگان" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-foreground">
                  همه رانندگان
                </SelectItem>
                {drivers.map((driver) => (
                  <SelectItem
                    key={driver.id}
                    value={driver.id.toString()}
                    className="text-foreground"
                  >
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Code Filter */}
          <div className="grid gap-2">
            <Label htmlFor="trackingCode" className="text-foreground text-sm">
              کد پیگیری
            </Label>
            <Input
              id="trackingCode"
              value={filters.trackingCode}
              onChange={(e) => setFilters({ ...filters, trackingCode: e.target.value })}
              placeholder="FLW-..."
              className="bg-secondary border-border text-foreground"
            />
          </div>

          {/* Start Date Filter */}
          <div className="grid gap-2">
            <Label className="text-foreground text-sm">
              از تاریخ
            </Label>
            <PersianDatePicker
              value={filters.startDate || undefined}
              onChange={(date) => setFilters({ ...filters, startDate: date || null })}
              placeholder="انتخاب تاریخ"
              showTimePicker
            />
          </div>

          {/* End Date Filter */}
          <div className="grid gap-2">
            <Label className="text-foreground text-sm">
              تا تاریخ
            </Label>
            <PersianDatePicker
              value={filters.endDate || undefined}
              onChange={(date) => setFilters({ ...filters, endDate: date || null })}
              placeholder="انتخاب تاریخ"
              showTimePicker
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-2 mt-4 justify-end">
          <Button
            onClick={handleFilter}
            className="bg-primary text-primary-foreground"
          >
            <Filter className="h-4 w-4 ml-2" />
            اعمال فیلتر
          </Button>
          {hasFilters && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="border-border"
            >
              <X className="h-4 w-4 ml-2" />
              پاک کردن
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
