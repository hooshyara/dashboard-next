'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PersianDatePicker } from '@/components/ui/persian-calendar';
import { Filter, History, X, Package, Truck, Users } from 'lucide-react';
import { Log, LogAction, LogEntity } from '@/lib/types';
import { getLogs } from '@/lib/services';
import { format } from 'date-fns-jalali';
import DateCell from '@/components/ui/date-cell';
import LogsFilterContainer from '@/components/logs/logs-filter';

interface LogFilters {
  user: string;
  action: LogAction | 'all';
  startDate: Date | null;
  endDate: Date | null;
}

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

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/20 text-green-600 border-green-500/30',
  UPDATE: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  DELETE: 'bg-red-500/20 text-red-600 border-red-500/30',
  ASSIGN: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
};

const ENTITY_ICONS: Record<LogEntity, React.ReactNode> = {
  order: <Package className='h-4 w-4' />,
  driver: <Truck className='h-4 w-4' />,
  user: <Users className='h-4 w-4' />,
};

const ENTITY_LABELS: Record<LogEntity, string> = {
  order: 'سفارش',
  driver: 'راننده',
  user: 'کاربر',
};

function getActionColorClass(action: LogAction): string {
  if (action.startsWith('CREATE')) return ACTION_COLORS.CREATE;
  if (action.startsWith('UPDATE')) return ACTION_COLORS.UPDATE;
  if (action.startsWith('DELETE')) return ACTION_COLORS.DELETE;
  if (action.startsWith('ASSIGN')) return ACTION_COLORS.ASSIGN;
  return 'bg-muted ';
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LogFilters>({
    user: 'all',
    action: 'all',
    startDate: null,
    endDate: null,
  });
  const [appliedFilters, setAppliedFilters] = useState<LogFilters | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const logsData = await getLogs();
      setLogs(logsData);
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = [...new Set(logs.map((log) => log.user))];
    return users;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (appliedFilters) {
      // User filter
      if (appliedFilters.user !== 'all') {
        result = result.filter((log) => log.user === appliedFilters.user);
      }

      // Action filter
      if (appliedFilters.action !== 'all') {
        result = result.filter((log) => log.action === appliedFilters.action);
      }

      // Date range filter
      if (appliedFilters.startDate) {
        result = result.filter((log) => new Date(log.createdAt) >= appliedFilters.startDate!);
      }
      if (appliedFilters.endDate) {
        result = result.filter((log) => new Date(log.createdAt) <= appliedFilters.endDate!);
      }
    }

    // Sort by date (newest first)
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [logs, appliedFilters]);

  function handleApplyFilter() {
    setAppliedFilters({ ...filters });
  }

  function handleClearFilter() {
    setFilters({
      user: 'all',
      action: 'all',
      startDate: null,
      endDate: null,
    });
    setAppliedFilters(null);
  }

  const hasFilters = filters.user !== 'all' || filters.action !== 'all' || filters.startDate || filters.endDate;

  return (
    <DashboardLayout title='لاگ‌ها'>
      {/* Filters Card */}
      <LogsFilterContainer
        uniqueUsers={uniqueUsers}
        filters={filters}
        onFilter={handleApplyFilter}
        onChange={setFilters}
        onClear={handleClearFilter}
        className='hidden md:flex'
      />

      {/* Results Card */}
      <Card className='bg-card border-border'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div className='w-full flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <CardTitle className='text-foreground flex items-center gap-2'>
                <History className='h-5 w-5' />
                تاریخچه فعالیت‌ها
              </CardTitle>
              {appliedFilters && <span className='text-sm '>({filteredLogs.length} رکورد)</span>}
            </div>

            <LogsFilterContainer
              uniqueUsers={uniqueUsers}
              filters={filters}
              onFilter={handleApplyFilter}
              onChange={setFilters}
              onClear={handleClearFilter}
              className='md:hidden'
              isDrawer
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-16'>
              <div className=''>در حال بارگذاری...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16 '>
              <History className='h-12 w-12 mb-4 opacity-50' />
              <p>لاگی یافت نشد</p>
              <p className='text-sm'>فیلترها را تغییر دهید</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-border'>
                    <TableHead className='text-right text-foreground w-16'>شناسه</TableHead>
                    <TableHead className='text-right text-foreground'>کاربر</TableHead>
                    <TableHead className='text-right text-foreground'>عملیات</TableHead>
                    <TableHead className='text-right text-foreground'>موجودیت</TableHead>
                    <TableHead className='text-right text-foreground'>توضیحات</TableHead>
                    <TableHead className='text-right text-foreground'>تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, index) => {
                    console.log('log: ', log);
                    return (
                      <TableRow
                        key={log.id}
                        className='border-border'
                      >
                        <TableCell className='text-right font-mono '>{index + 1}</TableCell>
                        <TableCell className='text-right text-foreground font-medium'>
                          {log.user}
                          {/* console.log('mobile: ', mobile); */}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Badge className={getActionColorClass(log.action)}>{ACTION_LABELS[log.action]}</Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center gap-2 text-foreground'>
                            {ENTITY_ICONS[log.entity]}
                            <span>{ENTITY_LABELS[log.entity]}</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right text-foreground max-w-xs truncate'>
                          {log.description}
                        </TableCell>
                        <TableCell className='text-right  whitespace-nowrap'>
                          <DateCell date={log.createdAt} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
