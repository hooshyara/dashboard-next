'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MapPin } from 'lucide-react';
import { Location } from '@/lib/types';

interface LocationsTableProps {
  locations: Location[];
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}

export function LocationsTable({ locations, onEdit, onDelete }: LocationsTableProps) {
if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 ">
        <MapPin className="h-12 w-12 mb-4 opacity-50" />
        <p>هیچ آدرسی ثبت نشده است</p>
        <p className="text-sm">برای افزودن آدرس جدید، از دکمه &quot;افزودن آدرس&quot; استفاده کنید</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead align='right' className="text-foreground">نام مقصد</TableHead>
            <TableHead align='right' className="text-foreground">آدرس</TableHead>
            <TableHead align='right' className="text-foreground">مختصات</TableHead>
            <TableHead align='right' className="text-foreground">توضیحات</TableHead>
            <TableHead align='right' className="text-foreground text-left">عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id} className="border-border">
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {location.name}
                </div>
              </TableCell>
              <TableCell className="text-foreground max-w-[250px]">
                <span className="line-clamp-2">{location.address}</span>
              </TableCell>
              <TableCell className="font-mono text-xs ">
                <div className="flex flex-col gap-0.5">
                  <span>Lat: {location.lat.toFixed(4)}</span>
                  <span>Lng: {location.lng.toFixed(4)}</span>
                </div>
              </TableCell>
              <TableCell className=" max-w-[200px]">
                <span className="line-clamp-2">{location.description || '-'}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(location)}
                    className="h-8 w-8 text-foreground hover:bg-gray-200 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(location)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
