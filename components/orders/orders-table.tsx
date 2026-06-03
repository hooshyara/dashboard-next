"use client";

import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABEL_FA,
  getDisplayedOrderDriver,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns-jalali";
import DateCell from "../ui/date-cell";

interface OrdersTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-warning/20 text-warning border-warning/30",
  [OrderStatus.ASSIGNED]: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  [OrderStatus.CANCEL]:
    "bg-destructive/20 text-destructive border-destructive/30",
};

export function OrdersTable({ orders, onEdit, onDelete }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 "
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">سفارشی یافت نشد</h3>
        <p className="text-sm  mt-1">
          با کلیک روی دکمه «افزودن سفارش» یک سفارش جدید ایجاد کنید.
        </p>
      </div>
    );
  }
  
  console.log('orders: ', orders);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-right text-foreground">ردیف</TableHead>
            <TableHead className="text-right text-foreground">
              نام مقصد
            </TableHead>
            <TableHead className="text-right text-foreground">آدرس</TableHead>
            <TableHead className="text-right text-foreground">گیرنده</TableHead>
            <TableHead className="text-right text-foreground">موبایل</TableHead>
            <TableHead className="text-right text-foreground">
              زمان تحویل
            </TableHead>
            <TableHead className="text-right text-foreground">
              نوع تخصیص
            </TableHead>
            <TableHead className="text-right text-foreground">راننده</TableHead>
            <TableHead className="text-right text-foreground">وضعیت</TableHead>
            <TableHead className="text-right text-foreground">قیمت</TableHead>
            <TableHead className="text-right text-foreground">عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => {
            const displayedDriver = getDisplayedOrderDriver(order);
            return (
              <TableRow key={order.id} className="hover:bg-muted/30">
                <TableCell className="text-foreground font-medium">
                  {index + 1}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {order.locationName || "-"}
                </TableCell>
                <TableCell className="text-foreground max-w-[180px] truncate">
                  {order.address}
                </TableCell>
                <TableCell className="text-foreground">
                  {order.contactPerson}
                </TableCell>
                <TableCell className=" text-sm font-mono">
                  {order.mobile || "-"}
                </TableCell>
                <TableCell className=" text-sm">
                  <DateCell date={order?.deliveryTime} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      order.assignType === "AI"
                        ? "bg-chart-4/20 text-chart-4 border-chart-4/30"
                        : "bg-chart-3/20 text-chart-3 border-chart-3/30"
                    }
                  >
                    {order.assignType === "AI" ? "هوش مصنوعی" : "دستی"}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">
                  {displayedDriver ? (
                    displayedDriver.name
                  ) : (
                    <span className="">تخصیص داده نشده</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[order.status]}>
                    {ORDER_STATUS_LABEL_FA[order.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {order.price !== null &&
                  order.price !== undefined
                    ? Number(order.price).toLocaleString("fa-IR") + " ریال"
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(order)}
                      className="h-8 w-8  hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(order)}
                      className="h-8 w-8  hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
