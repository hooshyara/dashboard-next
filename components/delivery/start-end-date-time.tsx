'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  setHours,
  setMinutes,
} from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon } from 'lucide-react';

const PERSIAN_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

interface PersianCalendarProps {
  selectedStart?: Date;
  onSelectStart?: (date: Date | undefined) => void;
  selectedEnd?: Date;
  onSelectEnd?: (date: Date | undefined) => void;
  className?: string;
  showTimePicker?: boolean;
}

function PersianCalendar({
  selectedStart,
  selectedEnd,
  onSelectStart,
  onSelectEnd,
  className,
  showTimePicker = false,
}: PersianCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedStart || new Date());
  const [startHours, setStartHoursValue] = React.useState(
    selectedStart ? selectedStart.getHours().toString().padStart(2, '0') : '12',
  );
  const [startMinutes, setStartMinutesValue] = React.useState(
    selectedStart ? selectedStart.getMinutes().toString().padStart(2, '0') : '00',
  );
  const [endHours, setEndHoursValue] = React.useState(
    selectedEnd ? selectedEnd.getHours().toString().padStart(2, '0') : '12',
  );
  const [endMinutes, setEndMinutesValue] = React.useState(
    selectedEnd ? selectedEnd.getMinutes().toString().padStart(2, '0') : '00',
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 6 }); // Saturday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 6 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDayClick = (day: Date) => {
    let newStartDate = day;
    let newEndDate = day;
    if (showTimePicker) {
      newStartDate = setHours(newStartDate, parseInt(startHours) || 0);
      newStartDate = setMinutes(newStartDate, parseInt(startMinutes) || 0);
      newEndDate = setHours(newEndDate, parseInt(endHours) || 0);
      newEndDate = setMinutes(newEndDate, parseInt(endMinutes) || 0);
    }
    onSelectStart?.(newStartDate);
    onSelectEnd?.(newEndDate);
  };

  const handleTimeChange = () => {
    if (selectedStart && selectedEnd) {
      let newStartDate = setHours(selectedStart, parseInt(startHours) || 0);
      newStartDate = setMinutes(newStartDate, parseInt(startMinutes) || 0);
      let newEndDate = setHours(selectedEnd, parseInt(endHours) || 0);
      newEndDate = setMinutes(newEndDate, parseInt(endMinutes) || 0);
      onSelectStart?.(newStartDate);
      onSelectEnd?.(newEndDate);
    }
  };

  React.useEffect(() => {
    if (showTimePicker && selectedStart && selectedEnd) {
      handleTimeChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHours, startMinutes, endHours, endMinutes]);

  return (
    <div
      className={cn('p-3 bg-popover rounded-lg', className)}
      dir='rtl'
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7'
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRightIcon className='h-4 w-4' />
        </Button>
        <div className='font-medium text-sm'>{format(currentMonth, 'MMMM yyyy', { locale: faIR })}</div>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7'
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeftIcon className='h-4 w-4' />
        </Button>
      </div>

      {/* Weekdays */}
      <div className='grid grid-cols-7 mb-2'>
        {PERSIAN_WEEKDAYS.map((day) => (
          <div
            key={day}
            className='text-center text-xs font-medium  py-1'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className='grid grid-cols-7 gap-1'>
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedStart && isSameDay(day, selectedStart);

          return (
            <Button
              key={index}
              variant='ghost'
              size='icon'
              className={cn(
                'h-8 w-8 p-0 font-normal',
                !isCurrentMonth && ' opacity-50',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              )}
              onClick={() => handleDayClick(day)}
            >
              {format(day, 'd', { locale: faIR })}
            </Button>
          );
        })}
      </div>

      {/* Time Picker */}
      {showTimePicker && (
        <>
          <div className='flex items-center justify-center gap-2 mt-2 pt-2 border-t border-border'>
            <Input
              type='text'
              value={startMinutes}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                if (parseInt(val) <= 59 || val === '') setStartMinutesValue(val);
              }}
              className='w-12 text-center bg-secondary border-border'
              placeholder='00'
            />
            <span className='text-foreground'>:</span>
            <Input
              type='text'
              value={startHours}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                if (parseInt(val) <= 23 || val === '') setStartHoursValue(val);
              }}
              className='w-12 text-center bg-secondary border-border'
              placeholder='12'
            />
            <span className=' text-sm'>ساعت شروع</span>
          </div>
          <div className='flex items-center justify-center gap-2 mt-2 pt-2 border-t border-border'>
            <Input
              type='text'
              value={endMinutes}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                if (parseInt(val) <= 59 || val === '') setEndMinutesValue(val);
              }}
              className='w-12 text-center bg-secondary border-border'
              placeholder='00'
            />
            <span className='text-foreground'>:</span>
            <Input
              type='text'
              value={endHours}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                if (parseInt(val) <= 23 || val === '') setEndHoursValue(val);
              }}
              className='w-12 text-center bg-secondary border-border'
              placeholder='12'
            />
            <span className=' text-sm'>ساعت پایان</span>
          </div>
          <div className='flex items-center justify-center gap-2 mt-2 pt-2 border-t border-border'>
            <Button
              size='sm'
              onClick={() => {
                setStartHoursValue('00');
                setStartMinutesValue('00');
                setEndHoursValue('14');
                setEndMinutesValue('00');
              }}
              variant='outline'
            >
              صبح
            </Button>
            <Button
              size='sm'
              onClick={() => {
                setStartHoursValue('14');
                setStartMinutesValue('00');
                setEndHoursValue('23');
                setEndMinutesValue('59');
              }}
              variant='outline'
            >
              عصر
            </Button>
            <Button
              size='sm'
              onClick={() => {
                setStartHoursValue('00');
                setStartMinutesValue('00');
                setEndHoursValue('23');
                setEndMinutesValue('59');
              }}
              variant='outline'
            >
              تمام روز
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface PersianDatePickerProps {
  startValue?: Date;
  onChangeStartValue?: (date: Date | undefined) => void;
  endValue?: Date;
  onChangeEndValue?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  showTimePicker?: boolean;
  disabled?: boolean;
  loadRoutes?: (isNeshanOptimizer?: boolean) => Promise<void>;
}

function PersianDatePicker({
  startValue,
  onChangeStartValue,
  endValue,
  onChangeEndValue,
  placeholder = 'انتخاب تاریخ',
  className,
  showTimePicker = false,
  disabled = false,
  loadRoutes,
}: PersianDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState<Date | undefined>(startValue);
  const [endDate, setEndDate] = React.useState<Date | undefined>(endValue);

  const handleSelectStart = (date: Date | undefined) => {
    setStartDate(date);
  };

  const formatStartValue = () => {
    if (!startValue) return '';
    if (showTimePicker) {
      return format(startValue, 'yyyy/MM/dd HH:mm', { locale: faIR });
    }
    return format(startValue, 'yyyy/MM/dd', { locale: faIR });
  };

  const handleSelectEnd = (date: Date | undefined) => {
    setEndDate(date);
  };

  const formatEndValue = () => {
    if (!endValue) return '';
    if (showTimePicker) {
      return format(endValue, 'HH:mm', { locale: faIR });
    }
    return format(endValue, 'yyyy/MM/dd', { locale: faIR });
  };

  const submitDate = () => {
    onChangeStartValue?.(startDate);
    onChangeEndValue?.(endDate);
    setOpen(false);
  };

  React.useEffect(() => {
    if (startDate && endDate) {
      loadRoutes?.();
    }
  }, [startValue, endValue]);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full justify-start text-right font-normal bg-secondary border-border',
            (!startValue || !endValue) && '',
            className,
          )}
        >
          <CalendarIcon className='ml-2 h-4 w-4' />
          {startValue && endValue ? (
            <span dir='ltr'>{`${formatStartValue()} - ${formatEndValue()}`}</span>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto p-0 bg-popover border-border'
        align='start'
      >
        <PersianCalendar
          selectedStart={startDate}
          selectedEnd={endDate}
          onSelectStart={handleSelectStart}
          onSelectEnd={handleSelectEnd}
          showTimePicker={showTimePicker}
        />
        {showTimePicker && (
          <div className='p-3 pt-0 flex justify-end'>
            <Button
              size='sm'
              onClick={submitDate}
            >
              تایید
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { PersianCalendar, PersianDatePicker };
