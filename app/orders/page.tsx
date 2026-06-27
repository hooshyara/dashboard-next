"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrderFormDialog } from "@/components/orders/order-form-dialog";
import OrdersFilterContainer, {
  OrdersFilterValues,
} from "@/components/orders/orders-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Printer } from "lucide-react";
import { Order, Driver, Location } from "@/lib/types";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import {
  getOrders,
  getDrivers,
  getLocations,
  createOrder,
  updateOrder,
  deleteOrder,
  filterOrders,
  hasOrderFilter,
} from "@/lib/services";
import {
  BulkUploadDialog,
  ParsedOrder,
} from "@/components/orders/bulk-upload-dialog";
import { PermissionGate } from "@/components/auth/permission-gate";
import { usePermissions } from "@/components/auth/permission-provider";
import { guardedCall, PermissionDeniedError } from "@/lib/permissions";
import { OrderLabelPrint } from "@/components/orders/order-label-print";
import { OrdersPrintView } from "@/components/orders/orders-print-view";
import { getOrderMeta, OrderMeta } from "@/lib/order-metadata";

export default function OrdersPage() {
  const { has } = usePermissions();
  const [orders, setOrders] = useState<Partial<Order>[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [filters, setFilters] = useState<OrdersFilterValues | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printMeta, setPrintMeta] = useState<OrderMeta | null>(null);
  const [printMode, setPrintMode] = useState<"label" | "receipt">("label");
  // سفارش‌هایی که در نمای چاپ کامل رندر می‌شوند (یک سفارش برای چاپ تکی، همه برای چاپ کلی)
  const [ordersToPrint, setOrdersToPrint] = useState<Order[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Helper function to sort orders by newest first (descending createdAt)
  function sortOrdersByNewest(ordersToSort: Order[]): Order[] {
    return [...ordersToSort].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async function loadData() {
    setLoading(true);
    const [ordersData, driversData, locationsData] = await Promise.all([
      getOrders(),
      getDrivers(),
      getLocations(),
    ]);
    setOrders(sortOrdersByNewest(ordersData));
    setDrivers(driversData);
    setLocations(locationsData);
    setLoading(false);
  }

  function handleAddOrder() {
    setEditingOrder(null);
    setFormOpen(true);
  }

  function handleEditOrder(order: Order) {
    setEditingOrder(order);
    setFormOpen(true);
  }

  function handlePrintLabel(order: Order) {
    setOrdersToPrint([]);
    setPrintOrder(order as Order);
    setPrintMeta(getOrderMeta(order.id));
    setPrintMode("label");
    // اجازه می‌دهیم نمای چاپ رندر شود، سپس پنجرهٔ چاپ باز می‌شود
    setTimeout(() => {
      window.print();
    }, 100);
  }

  function handleDeleteClick(order: Order) {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  }

  // چاپ کامل یک سفارش — فقط همان سفارش در نمای چاپ رندر می‌شود
  function handlePrintOrder(order: Order) {
    setPrintOrder(null);
    setOrdersToPrint([order]);
    setTimeout(() => {
      window.print();
    }, 100);
  }

  // چاپ همهٔ سفارش‌های نمایش‌داده‌شده (با فیلترهای فعلی)
  function handlePrintAllOrders() {
    setPrintOrder(null);
    setOrdersToPrint(orders as Order[]);
    setTimeout(() => {
      window.print();
    }, 100);
  }

  async function handleConfirmDelete() {
    if (orderToDelete) {
      try {
        await guardedCall(
          "order:delete",
          () => deleteOrder(orderToDelete.id),
          has,
        );
        setOrders(orders.filter((o) => o.id !== orderToDelete.id));
      } catch (e) {
        if (e instanceof PermissionDeniedError) {
          console.error("[v0]", e.message);
        } else {
          throw e;
        }
      } finally {
        setDeleteDialogOpen(false);
        setOrderToDelete(null);
      }
    }
  }

  async function handleSaveOrder(orderData: Order) {
    if ("id" in orderData && "trackingCode" in orderData) {
      // Update existing order
      const updated = await guardedCall(
        "order:update",
        () => updateOrder(orderData.id, orderData),
        has,
      );
      setOrders(
        sortOrdersByNewest(
          orders.map((o) => (o.id === updated.id ? updated : o)),
        ),
      );
      setEditingOrder(updated);
      return updated;
    } else {
      // Create new order - add at beginning (newest first)
      const created = await guardedCall(
        "order:create",
        async () => await createOrder(orderData),
        has,
      );
      setOrders([created, ...orders]);
      return created;
    }
    // await loadData();
  }

  async function handleBulkUpload(parsedOrders: ParsedOrder[]) {
    const results: Order[] = [];
    for (const parsedOrder of parsedOrders) {
      const orderData = {
        address: "",
        assignType: "AI" as const,
        contactPerson: parsedOrder.contactPerson,
        sender: null,
        sender_mobile: null,
        deliveryTime: parsedOrder.deliveryTime,
        price: parsedOrder.price,
        description: parsedOrder.description,
        status: "pending" as const,
        mobile: parsedOrder.mobile,
        locationName: null,
        returnTime: parsedOrder.returnTime,
        productCode: parsedOrder.productCode,
        lat: null,
        lng: null,
        pickupPlaceId: parsedOrder.pickupLocationId,
        dropoffPlaceId: parsedOrder.dropoffLocationId,
        driver: null,
        driverId: null,
        returnDriver: null,
      };
      const created = await guardedCall(
        "order:create",
        () => createOrder(orderData),
        has,
      );
      results.push(created);
    }
    // Sort with newest first after bulk upload
    setOrders(sortOrdersByNewest([...orders, ...results]));
  }

  async function handleFilter(filterValues: OrdersFilterValues) {
    const active = hasOrderFilter(filterValues);
    setFilters(active ? filterValues : null);
    setLoading(true);
    try {
      const data = active
        ? await filterOrders(filterValues)
        : await getOrders();
      setOrders(sortOrdersByNewest(data));
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearFilter() {
    setFilters(null);
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(sortOrdersByNewest(data));
    } finally {
      setLoading(false);
    }
  }

  // Handler for when a new location is created from the order form
  function handleLocationCreated(location: Location) {
    setLocations((prev) => [...prev, location]);
  }

  const isFiltered = filters !== null;

  return (
    <DashboardLayout title="سفارشات">
      <OrdersFilterContainer
        drivers={drivers}
        onFilter={handleFilter}
        onClear={handleClearFilter}
        className="hidden md:flex"
      />

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-foreground">مدیریت سفارشات</CardTitle>
            {isFiltered && (
              <span className="text-sm ">
                (فیلتر شده: {orders.length} سفارش)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <OrdersFilterContainer
              drivers={drivers}
              onFilter={handleFilter}
              onClear={handleClearFilter}
              className="md:hidden"
              isDrawer
            />

            <Button
              variant="outline"
              onClick={handlePrintAllOrders}
              disabled={orders.length === 0}
              className="border-border gap-2"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">پرینت همه سفارش‌ها</span>
            </Button>

            <PermissionGate permission="order:create">
              <Button
                onClick={handleAddOrder}
                className="bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton columns={7} rows={6} />
          ) : (
            <OrdersTable
              orders={orders}
              onEdit={handleEditOrder}
              onDelete={handleDeleteClick}
              onPrintLabel={handlePrintLabel}
              onPrintOrder={handlePrintOrder}
            />
          )}
        </CardContent>
      </Card>

      <OrderFormDialog
        key={editingOrder?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editingOrder}
        drivers={drivers}
        locations={locations}
        onSave={handleSaveOrder}
        onLocationCreated={handleLocationCreated}
        onAutoPrint={(order) => handlePrintLabel(order)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              حذف سفارش
            </AlertDialogTitle>
            <AlertDialogDescription className="">
              آیا مطمئن هستید که می‌خواهید سفارش با کد پیگیری «
              {orderToDelete?.trackingCode}» را حذف کنید؟ این عمل قابل بازگشت
              نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-border">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        locations={locations}
        onUpload={handleBulkUpload}
      />

      <OrderLabelPrint order={printOrder} meta={printMeta} mode={printMode} />
      <OrdersPrintView orders={ordersToPrint} />
    </DashboardLayout>
  );
}
