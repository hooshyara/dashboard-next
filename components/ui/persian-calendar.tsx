'use client'

import * as React from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, setHours, setMinutes } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Calendar as CalendarIcon } from 'lucide-react'

const PERSIAN_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

interface PersianCalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  showTimePicker?: boolean
}

function PersianCalendar({
  selected,
  onSelect,
  className,
  showTimePicker = false,
}: PersianCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())
  const [hours, setHoursValue] = React.useState(selected ? selected.getHours().toString().padStart(2, '0') : '12')
  const [minutes, setMinutesValue] = React.useState(selected ? selected.getMinutes().toString().padStart(2, '0') : '00')

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 6 }) // Saturday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 6 })
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handleDayClick = (day: Date) => {
    let newDate = day
    if (showTimePicker) {
      newDate = setHours(newDate, parseInt(hours) || 0)
      newDate = setMinutes(newDate, parseInt(minutes) || 0)
    }
    onSelect?.(newDate)
  }

  const handleTimeChange = () => {
    if (selected) {
      let newDate = setHours(selected, parseInt(hours) || 0)
      newDate = setMinutes(newDate, parseInt(minutes) || 0)
      onSelect?.(newDate)
    }
  }

  React.useEffect(() => {
    if (showTimePicker && selected) {
      handleTimeChange()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours, minutes])

  return (
    <div className={cn('p-3 bg-popover rounded-lg', className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <div className="font-medium text-sm">
          {format(currentMonth, 'MMMM yyyy', { locale: faIR })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-2">
        {PERSIAN_WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium  py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selected && isSameDay(day, selected)
          const isTodayDate = isToday(day)

          return (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 p-0 font-normal',
                !isCurrentMonth && ' opacity-50',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                isTodayDate && !isSelected && 'bg-accent text-accent-foreground',
              )}
              onClick={() => handleDayClick(day)}
            >
              {format(day, 'd', { locale: faIR })}
            </Button>
          )
        })}
      </div>

      {/* Time Picker */}
      {showTimePicker && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
          <Input
            type="text"
            value={minutes}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 2)
              if (parseInt(val) <= 59 || val === '') setMinutesValue(val)
            }}
            className="w-12 text-center bg-secondary border-border"
            placeholder="00"
          />
          <span className="text-foreground">:</span>
          <Input
            type="text"
            value={hours}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 2)
              if (parseInt(val) <= 23 || val === '') setHoursValue(val)
            }}
            className="w-12 text-center bg-secondary border-border"
            placeholder="12"
          />
          <span className=" text-sm">ساعت</span>
        </div>
      )}
    </div>
  )
}

interface PersianDatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  showTimePicker?: boolean
  disabled?: boolean
}

function PersianDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  className,
  showTimePicker = false,
  disabled = false,
}: PersianDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
    if (!showTimePicker) {
      setOpen(false)
    }
  }

  const formatValue = () => {
    if (!value) return ''
    if (showTimePicker) {
      return format(value, 'yyyy/MM/dd HH:mm', { locale: faIR })
    }
    return format(value, 'yyyy/MM/dd', { locale: faIR })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-right font-normal bg-secondary border-border',
            !value && '',
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {value ? formatValue() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
        <PersianCalendar
          selected={value}
          onSelect={handleSelect}
          showTimePicker={showTimePicker}
        />
        {showTimePicker && (
          <div className="p-3 pt-0 flex justify-end">
            <Button size="sm" onClick={() => setOpen(false)}>
              تایید
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { PersianCalendar, PersianDatePicker }
