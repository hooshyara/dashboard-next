'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Filter } from 'lucide-react';

interface TimeFilterProps {
  onFilter: (startDate: Date, endDate: Date) => void;
  onClear: () => void;
}

export function TimeFilter({ onFilter, onClear }: TimeFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFilter = () => {
    if (startDate && endDate) {
      onFilter(new Date(startDate), new Date(endDate));
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onClear();
  };

  return (
    <Card className="bg-card border-border mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          فیلتر بر اساس زمان
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="grid gap-2 flex-1">
            <Label htmlFor="startDate" className="text-foreground text-sm">
              از تاریخ
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="grid gap-2 flex-1">
            <Label htmlFor="endDate" className="text-foreground text-sm">
              تا تاریخ
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleFilter}
              disabled={!startDate || !endDate}
              className="bg-primary text-primary-foreground"
            >
              <Filter className="h-4 w-4 ml-2" />
              فیلتر
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              className="border-border"
            >
              پاک کردن
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
