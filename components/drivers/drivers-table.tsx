"use client";

import { Driver } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Power,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface DriversTableProps {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onToggleActive: (driver: Driver) => void;
  onReorder: (drivers: Driver[]) => void | Promise<void>;
  onMoveUp?: (driver: Driver) => void | Promise<void>;
  onMoveDown?: (driver: Driver) => void | Promise<void>;
}

interface SortableRowProps {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onToggleActive: (driver: Driver) => void;
  onMoveUp?: (driver: Driver) => void | Promise<void>;
  onMoveDown?: (driver: Driver) => void | Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

const getPriorityBadge = (priority: number) => {
  const colors: Record<number, string> = {
    1: "bg-primary/20 text-primary border-primary/30",
    2: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    3: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    4: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    5: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  };
  return colors[priority] || colors[3];
};

function SortableRow({
  driver,
  onEdit,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: driver.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover:bg-muted/30 transition-colors",
        isDragging && "bg-muted/50 shadow-lg opacity-90",
        !driver.isActive && "opacity-60 bg-destructive/5",
      )}
    >
      <TableCell className="w-10">
        <div className="flex items-center gap-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
          >
            <GripVertical className="h-4 w-4 " />
          </button>
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveUp?.(driver)}
              disabled={isFirst}
              className="h-6 w-6  hover:text-foreground disabled:opacity-30"
              title="بالا بردن اولویت"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveDown?.(driver)}
              disabled={isLast}
              className="h-6 w-6  hover:text-foreground disabled:opacity-30"
              title="پایین بردن اولویت"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TableCell>
      {/* <TableCell className="font-mono ">
        {driver.id}
      </TableCell> */}
      <TableCell className="font-medium text-foreground">
        {driver.name}
      </TableCell>
      <TableCell className="text-foreground">{driver.car}</TableCell>
      <TableCell className="text-foreground">{driver.capacity}</TableCell>
      <TableCell>
        <Badge className={getPriorityBadge(driver.priority)}>
          {driver.priority}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          className={
            driver.isActive
              ? "bg-success/20 text-success border-success/30"
              : "bg-destructive/20 text-destructive border-destructive/30"
          }
        >
          {driver.isActive ? "فعال" : "غیرفعال"}
        </Badge>
      </TableCell>
      <TableCell className=" max-w-[150px] truncate">
        {driver.description}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(driver)}
            className="h-8 w-8  hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleActive(driver)}
            className={cn(
              "h-8 w-8",
              driver.isActive
                ? "text-success hover:text-success/80"
                : "text-destructive hover:text-destructive/80",
            )}
            title={driver.isActive ? "غیرفعال کردن" : "فعال کردن"}
          >
            <Power className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DriversTable({
  drivers,
  onEdit,
  onToggleActive,
  onReorder,
  onMoveUp,
  onMoveDown,
}: DriversTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = drivers.findIndex((d) => d.id === active.id);
      const newIndex = drivers.findIndex((d) => d.id === over.id);

      const reorderedDrivers = arrayMove(drivers, oldIndex, newIndex);

      // Recalculate priorities based on new positions
      const updatedDrivers = reorderedDrivers.map((driver, index) => ({
        ...driver,
        priority: index + 1 > 5 ? 5 : index + 1,
      }));

      await onReorder(updatedDrivers);
    }
  };

  if (drivers.length === 0) {
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">
          راننده‌ای یافت نشد
        </h3>
        <p className="text-sm  mt-1">
          با کلیک روی دکمه «افزودن راننده» یک راننده جدید اضافه کنید.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-right text-foreground w-10"></TableHead>
              {/* <TableHead className="text-right text-foreground">
                شناسه
              </TableHead> */}
              <TableHead className="text-right text-foreground">نام</TableHead>
              <TableHead className="text-right text-foreground">
                خودرو
              </TableHead>
              <TableHead className="text-right text-foreground">
                ظرفیت
              </TableHead>
              <TableHead className="text-right text-foreground">
                اولویت
              </TableHead>
              <TableHead className="text-right text-foreground">
                وضعیت
              </TableHead>
              <TableHead className="text-right text-foreground">
                توضیحات
              </TableHead>
              <TableHead className="text-right text-foreground">
                عملیات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={drivers.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {drivers.map((driver, index) => (
                <SortableRow
                  key={driver.id}
                  driver={driver}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  isFirst={index === 0}
                  isLast={index === drivers.length - 1}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </div>
      <p className="text-xs  mt-2 text-center">
        برای تغییر اولویت، از دکمه‌های بالا/پایین یا کشیدن و رها کردن استفاده
        کنید
      </p>
    </DndContext>
  );
}
