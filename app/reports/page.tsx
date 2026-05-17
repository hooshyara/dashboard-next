'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PersianDatePicker } from '@/components/ui/persian-calendar';
import { Filter, Printer, FileText, Users, Package, MapPin } from 'lucide-react';
import {
  Order,
  Driver,
  Location,
  OrderStatus,
  AssignType,
  ORDER_STATUS_LABEL_FA,
  getDisplayedOrderDriver,
} from '@/lib/types';
import { getOrders, getDrivers, getLocations } from '@/lib/services';
import { format } from 'date-fns-jalali';

type ReportType = 'orders' | 'drivers' | 'locations';

interface ReportFilters {
  destination: string;
  driverId: number | null;
  locationId: number | null;
  trackingCode: string;
  startDate: Date | null;
  endDate: Date | null;
}

const STATUS_LABELS = ORDER_STATUS_LABEL_FA;

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  [OrderStatus.ASSIGNED]: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  [OrderStatus.CANCEL]: 'bg-red-500/20 text-red-600 border-red-500/30',
};

const ASSIGN_TYPE_LABELS: Record<AssignType, string> = {
  AI: 'هوش مصنوعی',
  MANUAL: 'دستی',
};

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string; icon: React.ReactNode }[] = [
  { value: 'orders', label: 'گزارش سفارشات', icon: <Package className="h-4 w-4" /> },
  { value: 'drivers', label: 'گزارش رانندگان', icon: <Users className="h-4 w-4" /> },
  { value: 'locations', label: 'گزارش مقاصد', icon: <MapPin className="h-4 w-4" /> },
];

// Driver report stats
interface DriverReportItem {
  driver: Driver;
  totalOrders: number;
  assignedOrders: number;
  pendingOrders: number;
  canceledOrders: number;
}

// Location report stats
interface LocationReportItem {
  location: Location;
  totalOrders: number;
  assignedDrivers: Driver[];
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>('orders');
  const [filters, setFilters] = useState<ReportFilters>({
    destination: '',
    driverId: null,
    locationId: null,
    trackingCode: '',
    startDate: null,
    endDate: null,
  });
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [ordersData, driversData, locationsData] = await Promise.all([
      getOrders(),
      getDrivers(),
      getLocations(),
    ]);
    setOrders(ordersData);
    setDrivers(driversData);
    setLocations(locationsData);
    setLoading(false);
  }

  // Filter orders based on applied filters
  const filteredOrders = useMemo(() => {
    if (!appliedFilters) return orders;

    return orders.filter((order) => {
      if (appliedFilters.destination && order.locationName) {
        if (!order.locationName.toLowerCase().includes(appliedFilters.destination.toLowerCase())) {
          return false;
        }
      } else if (appliedFilters.destination && !order.locationName) {
        return false;
      }

      if (appliedFilters.driverId !== null && order.driverId !== appliedFilters.driverId) {
        return false;
      }

      if (appliedFilters.locationId !== null) {
        const location = locations.find(l => l.id === appliedFilters.locationId);
        if (location && order.locationName !== location.title) {
          return false;
        }
      }

      if (appliedFilters.trackingCode) {
        if (!order.trackingCode.toLowerCase().includes(appliedFilters.trackingCode.toLowerCase())) {
          return false;
        }
      }

      if (appliedFilters.startDate) {
        if (new Date(order.deliveryTime) < appliedFilters.startDate) {
          return false;
        }
      }
      if (appliedFilters.endDate) {
        if (new Date(order.deliveryTime) > appliedFilters.endDate) {
          return false;
        }
      }

      return true;
    });
  }, [orders, appliedFilters, locations]);

  // Driver report data
  const driverReportData = useMemo((): DriverReportItem[] => {
    return drivers.map(driver => {
      const driverOrders = filteredOrders.filter(o => o.driverId === driver.id);
      return {
        driver,
        totalOrders: driverOrders.length,
        assignedOrders: driverOrders.filter((o) => o.status === OrderStatus.ASSIGNED).length,
        pendingOrders: driverOrders.filter((o) => o.status === OrderStatus.PENDING).length,
        canceledOrders: driverOrders.filter((o) => o.status === OrderStatus.CANCEL).length,
      };
    }).filter(item => item.totalOrders > 0 || !appliedFilters);
  }, [drivers, filteredOrders, appliedFilters]);

  // Location report data
  const locationReportData = useMemo((): LocationReportItem[] => {
    return locations.map(location => {
      const locationOrders = filteredOrders.filter(o => o.locationName === location.title);
      const assignedDriverIds = new Set(locationOrders.filter(o => o.driverId).map(o => o.driverId));
      const assignedDrivers = drivers.filter(d => assignedDriverIds.has(d.id));
      return {
        location,
        totalOrders: locationOrders.length,
        assignedDrivers,
      };
    }).filter(item => item.totalOrders > 0 || !appliedFilters);
  }, [locations, filteredOrders, drivers, appliedFilters]);

  function handleApplyFilter() {
    setAppliedFilters({ ...filters });
  }

  function handleClearFilter() {
    setFilters({
      destination: '',
      driverId: null,
      locationId: null,
      trackingCode: '',
      startDate: null,
      endDate: null,
    });
    setAppliedFilters(null);
  }

  const handlePrintReport = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const driverName = appliedFilters?.driverId 
      ? drivers.find(d => d.id === appliedFilters.driverId)?.name || 'همه'
      : 'همه';

    const locationName = appliedFilters?.locationId
      ? locations.find(l => l.id === appliedFilters.locationId)?.title || 'همه'
      : 'همه';

    const reportTypeLabel = REPORT_TYPE_OPTIONS.find(r => r.value === reportType)?.label || '';

    let tableContent = '';

    if (reportType === 'orders') {
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>کد پیگیری</th>
              <th>نام مقصد</th>
              <th>راننده</th>
              <th>شخص تماس</th>
              <th>موبایل</th>
              <th>زمان تحویل</th>
              <th>وضعیت</th>
              <th>نوع تخصیص</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map((order, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td style="font-family: monospace;">${order.trackingCode}</td>
                <td>${order.locationName || '-'}</td>
                <td>${getDisplayedOrderDriver(order)?.name || 'تخصیص داده نشده'}</td>
                <td>${order.contactPerson}</td>
                <td style="font-family: monospace;">${order.mobile || '-'}</td>
                <td>${format(new Date(order.deliveryTime), 'yyyy/MM/dd HH:mm')}</td>
                <td>${STATUS_LABELS[order.status]}</td>
                <td>${ASSIGN_TYPE_LABELS[order.assignType]}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'drivers') {
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>نام راننده</th>
              <th>خودرو</th>
              <th>کل سفارشات</th>
              <th>تخصیص داده شده</th>
              <th>تخصیص داده نشده</th>
              <th>لغو شده</th>
            </tr>
          </thead>
          <tbody>
            ${driverReportData.map((item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.driver.name}</td>
                <td>${item.driver.car}</td>
                <td style="text-align: center;">${item.totalOrders}</td>
                <td style="text-align: center; color: blue;">${item.assignedOrders}</td>
                <td style="text-align: center; color: orange;">${item.pendingOrders}</td>
                <td style="text-align: center; color: red;">${item.canceledOrders}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>نام مقصد</th>
              <th>آدرس</th>
              <th>تعداد سفارشات</th>
              <th>رانندگان مسئول</th>
            </tr>
          </thead>
          <tbody>
            ${locationReportData.map((item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.location.title}</td>
                <td>${item.location.address}</td>
                <td style="text-align: center;">${item.totalOrders}</td>
                <td>${item.assignedDrivers.map(d => d.name).join('، ') || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>${reportTypeLabel}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid black;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .filters-info {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
          }
          .filters-info p {
            margin: 4px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f0f0f0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid black;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTypeLabel}</h1>
          <p>تاریخ چاپ: ${format(new Date(), 'yyyy/MM/dd HH:mm')}</p>
        </div>
        <div class="filters-info">
          <p><strong>فیلترهای اعمال شده:</strong></p>
          ${reportType === 'orders' ? `<p>مقصد: ${appliedFilters?.destination || 'همه'}</p>` : ''}
          <p>راننده: ${driverName}</p>
          <p>مقصد: ${locationName}</p>
          ${reportType === 'orders' ? `<p>کد پیگیری: ${appliedFilters?.trackingCode || 'همه'}</p>` : ''}
          <p>از تاریخ: ${appliedFilters?.startDate ? format(appliedFilters.startDate, 'yyyy/MM/dd') : '-'}</p>
          <p>تا تاریخ: ${appliedFilters?.endDate ? format(appliedFilters.endDate, 'yyyy/MM/dd') : '-'}</p>
          <p><strong>تعداد نتایج: ${
            reportType === 'orders' ? filteredOrders.length :
            reportType === 'drivers' ? driverReportData.length :
            locationReportData.length
          }</strong></p>
        </div>
        ${tableContent}
        <div class="footer">
          <p>سامانه مدیریت لجستیک - تمامی حقوق محفوظ است</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, [reportType, appliedFilters, filteredOrders, driverReportData, locationReportData, drivers, locations]);

  const hasFilters = filters.destination || filters.driverId || filters.locationId || filters.trackingCode || filters.startDate || filters.endDate;

  const getResultCount = () => {
    if (reportType === 'orders') return filteredOrders.length;
    if (reportType === 'drivers') return driverReportData.length;
    return locationReportData.length;
  };

  return (
    <DashboardLayout title="گزارشات">
      {/* Report Type Selection */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2">
            {REPORT_TYPE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={reportType === option.value ? 'default' : 'outline'}
                onClick={() => setReportType(option.value)}
                className={reportType === option.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'border-border'
                }
              >
                {option.icon}
                <span className="mr-2">{option.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" />
            فیلتر گزارش
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Destination Filter - only for orders */}
            {reportType === 'orders' && (
              <div className="grid gap-2">
                <Label htmlFor="destination" className="text-foreground text-sm">
                  مقصد (متن)
                </Label>
                <Input
                  id="destination"
                  value={filters.destination}
                  onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                  placeholder="نام مقصد..."
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            )}

            {/* Location Filter */}
            <div className="grid gap-2">
              <Label className="text-foreground text-sm">
                مقصد (لیست)
              </Label>
              <Select
                value={filters.locationId?.toString() || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    locationId: value === 'all' ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="همه مقاصد" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all" className="text-foreground">
                    همه مقاصد
                  </SelectItem>
                  {locations.map((location) => (
                    <SelectItem
                      key={location.id}
                      value={location.id.toString()}
                      className="text-foreground"
                    >
                      {location.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Tracking Code Filter - only for orders */}
            {reportType === 'orders' && (
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
            )}

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
              onClick={handleApplyFilter}
              className="bg-primary text-primary-foreground"
            >
              <Filter className="h-4 w-4 ml-2" />
              اعمال فیلتر
            </Button>
            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilter}
                className="border-border"
              >
                پاک کردن
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              نتایج گزارش
            </CardTitle>
            {appliedFilters && (
              <span className="text-sm text-muted-foreground">
                ({getResultCount()} نتیجه)
              </span>
            )}
          </div>
          <Button 
            onClick={handlePrintReport} 
            variant="outline" 
            className="border-border"
            disabled={getResultCount() === 0}
          >
            <Printer className="h-4 w-4 ml-2" />
            چاپ گزارش
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-muted-foreground">در حال بارگذاری...</div>
            </div>
          ) : getResultCount() === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>نتیجه‌ای یافت نشد</p>
              <p className="text-sm">فیلترها را تغییر دهید یا روی دکمه &quot;اعمال فیلتر&quot; کلیک کنید</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Orders Report Table */}
              {reportType === 'orders' && (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-foreground text-right">کد پیگیری</TableHead>
                      <TableHead className="text-foreground text-right">نام مقصد</TableHead>
                      <TableHead className="text-foreground text-right">راننده</TableHead>
                      <TableHead className="text-foreground text-right">شخص تماس</TableHead>
                      <TableHead className="text-foreground text-right">موبایل</TableHead>
                      <TableHead className="text-foreground text-right">زمان تحویل</TableHead>
                      <TableHead className="text-foreground text-right">وضعیت</TableHead>
                      <TableHead className="text-foreground text-right">نوع تخصیص</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="border-border">
                        <TableCell className="font-mono text-primary text-right">
                          {order.trackingCode}
                        </TableCell>
                        <TableCell className="text-foreground text-right">
                          {order.locationName || '-'}
                        </TableCell>
                        <TableCell className="text-foreground text-right">
                          {getDisplayedOrderDriver(order)?.name || 'تخصیص داده نشده'}
                        </TableCell>
                        <TableCell className="text-foreground text-right">
                          {order.contactPerson}
                        </TableCell>
                        <TableCell className="font-mono text-foreground text-right">
                          <span dir="ltr" className="inline-block">
                            {order.mobile || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-foreground text-right">
                          {format(new Date(order.deliveryTime), 'yyyy/MM/dd HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={STATUS_COLORS[order.status]}>
                            {STATUS_LABELS[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="border-border">
                            {ASSIGN_TYPE_LABELS[order.assignType]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Drivers Report Table */}
              {reportType === 'drivers' && (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-right text-foreground">راننده</TableHead>
                      <TableHead className="text-right text-foreground">خودرو</TableHead>
                      <TableHead className="text-foreground text-center">کل سفارشات</TableHead>
                      <TableHead className="text-foreground text-center">تخصیص داده شده</TableHead>
                      <TableHead className="text-foreground text-center">تخصیص داده نشده</TableHead>
                      <TableHead className="text-foreground text-center">لغو شده</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverReportData.map((item) => (
                      <TableRow key={item.driver.id} className="border-border">
                        <TableCell className="text-right text-foreground font-medium">
                          <div className="flex items-center gap-2 justify-end">
                            <Users className="h-4 w-4 text-primary shrink-0" />
                            {item.driver.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {item.driver.car}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="border-border">
                            {item.totalOrders}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                            {item.assignedOrders}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                            {item.pendingOrders}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
                            {item.canceledOrders}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Locations Report Table */}
              {reportType === 'locations' && (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-right text-foreground">مقصد</TableHead>
                      <TableHead className="text-right text-foreground">آدرس</TableHead>
                      <TableHead className="text-foreground text-center">تعداد سفارشات</TableHead>
                      <TableHead className="text-right text-foreground">رانندگان مسئول</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationReportData.map((item) => (
                      <TableRow key={item.location.id} className="border-border">
                        <TableCell className="text-right text-foreground font-medium">
                          <div className="flex items-center gap-2 justify-end">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            {item.location.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-foreground max-w-[250px]">
                          <span className="line-clamp-2">{item.location.address}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="border-border">
                            {item.totalOrders}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {item.assignedDrivers.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {item.assignedDrivers.map(driver => (
                                <Badge key={driver.id} variant="secondary" className="bg-secondary">
                                  {driver.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
