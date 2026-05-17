'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface DriversFilterValues {
  name: string;
  plateNumber: string;
  priority: number | null;
  minCapacity: number | null;
  maxCapacity: number | null;
}

interface DriversFilterProps {
  filters: DriversFilterValues;
  onChange: (filters: DriversFilterValues) => void;
  onClear: () => void;
}

const PRIORITY_OPTIONS = [
  { value: '1', label: 'اولویت ۱ (بالاترین)' },
  { value: '2', label: 'اولویت ۲' },
  { value: '3', label: 'اولویت ۳' },
  { value: '4', label: 'اولویت ۴' },
  { value: '5', label: 'اولویت ۵ (پایین‌ترین)' },
];

export function DriversFilter({ filters, onChange, onClear }: DriversFilterProps) {
  const hasFilters = filters.name || filters.plateNumber || filters.priority !== null || 
                     filters.minCapacity !== null || filters.maxCapacity !== null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Driver Name Filter */}
        <div className="grid gap-2">
          <Label htmlFor="driverName" className="text-foreground text-sm">
            نام راننده
          </Label>
          <Input
            id="driverName"
            value={filters.name}
            onChange={(e) => onChange({ ...filters, name: e.target.value })}
            placeholder="جستجو نام..."
            className="bg-secondary border-border text-foreground"
          />
        </div>

        {/* Plate Number Filter */}
        <div className="grid gap-2">
          <Label htmlFor="plateNumber" className="text-foreground text-sm">
            شماره پلاک / خودرو
          </Label>
          <Input
            id="plateNumber"
            value={filters.plateNumber}
            onChange={(e) => onChange({ ...filters, plateNumber: e.target.value })}
            placeholder="جستجو پلاک..."
            className="bg-secondary border-border text-foreground"
          />
        </div>

        {/* Priority Filter */}
        <div className="grid gap-2">
          <Label className="text-foreground text-sm">
            اولویت
          </Label>
          <Select
            value={filters.priority?.toString() || 'all'}
            onValueChange={(value) =>
              onChange({
                ...filters,
                priority: value === 'all' ? null : parseInt(value),
              })
            }
          >
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="همه اولویت‌ها" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground">
                همه اولویت‌ها
              </SelectItem>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-foreground"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Capacity Filter */}
        <div className="grid gap-2">
          <Label htmlFor="minCapacity" className="text-foreground text-sm">
            حداقل ظرفیت
          </Label>
          <Input
            id="minCapacity"
            type="number"
            min={0}
            value={filters.minCapacity ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                minCapacity: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            placeholder="از..."
            className="bg-secondary border-border text-foreground"
          />
        </div>

        {/* Max Capacity Filter */}
        <div className="grid gap-2">
          <Label htmlFor="maxCapacity" className="text-foreground text-sm">
            حداکثر ظرفیت
          </Label>
          <Input
            id="maxCapacity"
            type="number"
            min={0}
            value={filters.maxCapacity ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                maxCapacity: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            placeholder="تا..."
            className="bg-secondary border-border text-foreground"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasFilters && (
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="border-border"
          >
            <X className="h-4 w-4 ml-2" />
            پاک کردن فیلترها
          </Button>
        </div>
      )}
    </div>
  );
}
