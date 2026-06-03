'use client';

import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DriversTable } from '@/components/drivers/drivers-table';
import { DriverFormDialog } from '@/components/drivers/driver-form-dialog';
import DriversFilterContainer, { DriversFilterValues } from '@/components/drivers/drivers-filter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Driver } from '@/lib/types';
import { TableSkeleton } from '@/components/ui/loading-skeletons';
import { getDrivers, createDriver, updateDriver, deleteDriver, filterDrivers, hasDriverFilter } from '@/lib/services';
import Cookies from 'js-cookie';

const initialFilters: DriversFilterValues = {
  name: '',
  plateNumber: '',
  priority: null,
  minCapacity: null,
  maxCapacity: null,
};

function sortByPriority(list: Driver[]) {
  return [...list].sort((a, b) => a.priority - b.priority);
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [filters, setFilters] = useState<DriversFilterValues>(initialFilters);
  const filtersFirstRun = useRef(true);
  const userId = Number(Cookies.get('userId') ?? 0);

  // Functions
  const handleFilter = async (customFilters?: DriversFilterValues) => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      console.log('customFilters || filters: ', customFilters || filters);
      try {
        const data = hasDriverFilter(customFilters || filters)
          ? await filterDrivers(customFilters || filters)
          : await getDrivers();
        if (!cancelled) setDrivers(sortByPriority(data));
        if (customFilters) {
          setFilters(customFilters);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setDrivers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (filtersFirstRun.current) {
      filtersFirstRun.current = false;
      void load();
      return () => {
        cancelled = true;
      };
    }

    const t = window.setTimeout(() => {
      void load();
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  };
  useEffect(() => {
    handleFilter();
  }, []);

  function handleAddDriver() {
    setEditingDriver(null);
    setFormOpen(true);
  }

  function handleEditDriver(driver: Driver) {
    setEditingDriver(driver);
    setFormOpen(true);
  }

  async function handleDeleteDriver(driver: Driver) {
    await deleteDriver(driver.id);
    setDrivers(drivers.filter((d) => d.id !== driver.id));
  }

  async function handleToggleActive(driver: Driver) {
    const updated = await updateDriver(driver.id, {
      isActive: !driver.isActive,
      userId,
    });
    setDrivers(drivers.map((d) => (d.id === updated.id ? updated : d)));
  }

  async function handleReorder(reorderedDrivers: Driver[]) {
    const prevSnapshot = drivers;
    setDrivers(reorderedDrivers);
    const updates = reorderedDrivers.filter((d) => prevSnapshot.find((p) => p.id === d.id)?.priority !== d.priority);
    if (updates.length === 0) return;
    try {
      await Promise.all(
        updates.map((d) =>
          updateDriver(d.id, {
            priority: d.priority,
            userId,
          }),
        ),
      );
    } catch (e) {
      console.error(e);
      setDrivers(prevSnapshot);
    }
  }

  async function handleMoveUp(driver: Driver) {
    const index = drivers.findIndex((d) => d.id === driver.id);
    if (index <= 0) return;

    const reorderedDrivers = [...drivers];
    [reorderedDrivers[index - 1], reorderedDrivers[index]] = [reorderedDrivers[index], reorderedDrivers[index - 1]];

    const updatedDrivers = reorderedDrivers.map((d, i) => ({
      ...d,
      priority: i + 1 > 5 ? 5 : i + 1,
    }));

    await handleReorder(updatedDrivers);
  }

  async function handleMoveDown(driver: Driver) {
    const index = drivers.findIndex((d) => d.id === driver.id);
    if (index < 0 || index >= drivers.length - 1) return;

    const reorderedDrivers = [...drivers];
    [reorderedDrivers[index], reorderedDrivers[index + 1]] = [reorderedDrivers[index + 1], reorderedDrivers[index]];

    const updatedDrivers = reorderedDrivers.map((d, i) => ({
      ...d,
      priority: i + 1 > 5 ? 5 : i + 1,
    }));

    await handleReorder(updatedDrivers);
  }

  async function handleSaveDriver(driverData: Omit<Driver, 'id'> | Driver) {
    if ('id' in driverData) {
      const updated = await updateDriver(driverData.id, driverData);
      setDrivers(drivers.map((d) => (d.id === updated.id ? updated : d)));
    } else {
      const created = await createDriver({ ...driverData, isActive: true });
      setDrivers([...drivers, created].sort((a, b) => a.priority - b.priority));
    }
  }

  async function handleClearFilters() {
    await handleFilter(initialFilters);
  }

  const filterActive = hasDriverFilter(filters);

  return (
    <DashboardLayout title='رانندگان'>
      <Card className='bg-card border-border'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-foreground'>مدیریت رانندگان</CardTitle>

          <div className='flex gap-2'>
            <DriversFilterContainer
              filters={filters}
              onChange={setFilters}
              onFilter={handleFilter}
              onClear={handleClearFilters}
              className='md:hidden'
              isDrawer
            />
            <Button
              onClick={handleAddDriver}
              className='bg-primary text-primary-foreground'
            >
              <Plus className='h-4 w-4 ml-2' />
              افزودن راننده
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DriversFilterContainer
            filters={filters}
            onChange={setFilters}
            onFilter={handleFilter}
            onClear={handleClearFilters}
            className='hidden md:flex'
          />

          {filterActive && <div className='text-sm  mb-4'>{drivers.length} راننده مطابق فیلتر</div>}

          {loading ? (
            <TableSkeleton
              columns={8}
              rows={5}
            />
          ) : (
            <DriversTable
              drivers={drivers}
              onEdit={handleEditDriver}
              onToggleActive={handleToggleActive}
              onReorder={handleReorder}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          )}
        </CardContent>
      </Card>

      <DriverFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        driver={editingDriver}
        onSave={handleSaveDriver}
        onDelete={handleDeleteDriver}
      />
    </DashboardLayout>
  );
}
