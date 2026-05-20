'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Location } from '@/lib/types';

interface LocationSelectProps {
  locations: Location[];
  value: number | null;
  onChange: (location: Location | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function LocationSelect({
  locations,
  value,
  onChange,
  placeholder = 'انتخاب آدرس...',
  disabled = false,
}: LocationSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLocation = value ? locations.find((loc) => loc.id === value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between bg-secondary border-border text-foreground font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {selectedLocation ? (
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedLocation.title}</span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-card border-border" align="start">
        <Command className="bg-card">
          <CommandInput placeholder="جستجوی آدرس..." className="text-foreground" />
          <CommandList>
            <CommandEmpty className="text-muted-foreground py-4 text-center text-sm">
              آدرسی یافت نشد.
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-foreground cursor-pointer"
              >
                <Check
                  className={cn(
                    'ml-2 h-4 w-4',
                    !value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="text-muted-foreground">بدون انتخاب</span>
              </CommandItem>
              {locations.map((location) => (
                <CommandItem
                  key={location.id}
                  value={`${location.title} ${location.address}`}
                  onSelect={() => {
                    onChange(location);
                    setOpen(false);
                  }}
                  className="text-foreground cursor-pointer"
                >
                  <Check
                    className={cn(
                      'ml-2 h-4 w-4',
                      value === location.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{location.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {location.address}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
