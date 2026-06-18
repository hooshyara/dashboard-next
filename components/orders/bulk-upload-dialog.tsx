'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Location, OrderStatus } from '@/lib/types';
import { Upload, FileSpreadsheet, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
  onUpload: (orders: ParsedOrder[]) => Promise<void>;
}

export interface ParsedOrder {
  pickupLocationId: number;
  dropoffLocationId: number;
  contactPerson: string;
  deliveryTime: Date;
  mobile: string | null;
  description: string | null;
  productCode: string | null;
  returnTime: Date | null;
}

interface ParsedRow {
  rowNum: number;
  pickupName: string;
  dropoffName: string;
  contactPerson: string;
  deliveryTime: string;
  mobile?: string;
  description?: string;
  productCode?: string;
  returnTime?: string;
  error?: string;
  parsedOrder?: ParsedOrder;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .toLowerCase();
}

function findLocationByName(locations: Location[], name: string): Location | null {
  const normalized = normalizeText(name);
  return locations.find(
    (loc) =>
      normalizeText(loc.title) === normalized ||
      normalizeText(loc.address).includes(normalized) ||
      normalized.includes(normalizeText(loc.title))
  ) || null;
}

function parseExcelDate(value: unknown): Date | null {
  if (!value) return null;
  
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0);
    }
  }
  
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    // Try Persian date format (1403/01/15 14:30)
    const persianMatch = value.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);
    if (persianMatch) {
      // Simple approximation - for Persian calendar conversion
      const year = parseInt(persianMatch[1]);
      const month = parseInt(persianMatch[2]);
      const day = parseInt(persianMatch[3]);
      const hour = persianMatch[4] ? parseInt(persianMatch[4]) : 9;
      const minute = persianMatch[5] ? parseInt(persianMatch[5]) : 0;
      
      // If year is in Persian (around 1400s), convert roughly
      if (year >= 1300 && year <= 1500) {
        const gregorianYear = year + 621;
        return new Date(gregorianYear, month - 1, day, hour, minute);
      }
      return new Date(year, month - 1, day, hour, minute);
    }
  }
  
  if (value instanceof Date) {
    return value;
  }
  
  return null;
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  locations,
  onUpload,
}: BulkUploadDialogProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd hh:mm' });

      if (jsonData.length < 2) {
        setUploadError('فایل اکسل خالی است یا فقط سرستون دارد');
        setParsedRows([]);
        return;
      }

      // Skip header row
      const rows: ParsedRow[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        if (!row || row.length === 0 || !row[0]) continue;

        const pickupName = String(row[0] || '').trim();
        const dropoffName = String(row[1] || '').trim();
        const contactPerson = String(row[2] || '').trim();
        const deliveryTimeRaw = row[3];
        const mobile = row[4] ? String(row[4]).trim() : null;
        const description = row[5] ? String(row[5]).trim() : null;
        const productCode = row[6] ? String(row[6]).trim() : null;
        const returnTimeRaw = row[7];

        const parsedRow: ParsedRow = {
          rowNum: i + 1,
          pickupName,
          dropoffName,
          contactPerson,
          deliveryTime: String(deliveryTimeRaw || ''),
          mobile: mobile || undefined,
          description: description || undefined,
          productCode: productCode || undefined,
          returnTime: returnTimeRaw ? String(returnTimeRaw) : undefined,
        };

        // Validate
        const errors: string[] = [];
        
        const pickupLocation = findLocationByName(locations, pickupName);
        if (!pickupLocation) {
          errors.push(`مبدأ "${pickupName}" یافت نشد`);
        }

        const dropoffLocation = findLocationByName(locations, dropoffName);
        if (!dropoffLocation) {
          errors.push(`مقصد "${dropoffName}" یافت نشد`);
        }

        if (!contactPerson) {
          errors.push('نام تحویل گیرنده الزامی است');
        }

        const deliveryTime = parseExcelDate(deliveryTimeRaw);
        if (!deliveryTime) {
          errors.push('زمان تحویل نامعتبر است');
        }

        const returnTime = returnTimeRaw ? parseExcelDate(returnTimeRaw) : null;

        if (errors.length > 0) {
          parsedRow.error = errors.join('، ');
        } else if (pickupLocation && dropoffLocation && deliveryTime) {
          parsedRow.parsedOrder = {
            pickupLocationId: pickupLocation.id,
            dropoffLocationId: dropoffLocation.id,
            contactPerson,
            deliveryTime,
            mobile,
            description,
            productCode,
            returnTime,
          };
        }

        rows.push(parsedRow);
      }

      setParsedRows(rows);
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      setUploadError('خطا در خواندن فایل اکسل');
      setParsedRows([]);
    }
  };

  const handleUpload = async () => {
    const validOrders = parsedRows
      .filter((row) => row.parsedOrder)
      .map((row) => row.parsedOrder!);

    if (validOrders.length === 0) {
      setUploadError('هیچ سفارش معتبری برای آپلود وجود ندارد');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await onUpload(validOrders);
      handleClose();
    } catch (err) {
      console.error('Error uploading orders:', err);
      setUploadError('خطا در ارسال سفارشات به سرور');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setParsedRows([]);
    setFileName('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const validCount = parsedRows.filter((row) => row.parsedOrder).length;
  const errorCount = parsedRows.filter((row) => row.error).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-foreground">آپلود سفارشات از اکسل</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            فایل اکسل با ستون‌های: مبدأ، مقصد، شخص تماس، زمان تحویل، موبایل، توضیحات، کد گل، زمان بازگشت
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload Area */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-primary/5',
              fileName ? 'border-primary bg-primary/5' : 'border-border'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <span className="text-foreground font-medium">{fileName}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-muted-foreground">
                  برای انتخاب فایل اکسل کلیک کنید
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive text-sm">{uploadError}</span>
            </div>
          )}

          {/* Summary */}
          {parsedRows.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-foreground text-sm">
                  {validCount} سفارش معتبر
                </span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-destructive" />
                  <span className="text-foreground text-sm">
                    {errorCount} سفارش با خطا
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Parsed Rows Table */}
          {parsedRows.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-right px-3 py-2 text-foreground">ردیف</th>
                    <th className="text-right px-3 py-2 text-foreground">مبدأ</th>
                    <th className="text-right px-3 py-2 text-foreground">مقصد</th>
                    <th className="text-right px-3 py-2 text-foreground">شخص تماس</th>
                    <th className="text-right px-3 py-2 text-foreground">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowNum}
                      className={cn(
                        'border-t border-border',
                        row.error ? 'bg-destructive/5' : 'bg-success/5'
                      )}
                    >
                      <td className="px-3 py-2 text-muted-foreground">{row.rowNum}</td>
                      <td className="px-3 py-2 text-foreground">{row.pickupName}</td>
                      <td className="px-3 py-2 text-foreground">{row.dropoffName}</td>
                      <td className="px-3 py-2 text-foreground">{row.contactPerson}</td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="text-destructive text-xs">{row.error}</span>
                        ) : (
                          <span className="text-success text-xs">معتبر</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-border"
          >
            انصراف
          </Button>
          <Button
            onClick={handleUpload}
            className="bg-primary text-primary-foreground"
            disabled={validCount === 0 || isUploading}
          >
            {isUploading ? 'در حال ارسال...' : `ارسال ${validCount} سفارش`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
