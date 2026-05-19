'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Order } from '@/lib/types';
import { GripVertical, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface DraggableOrderProps {
  order: Order;
  index: number;
  showDetails?: boolean;
}

export function DraggableOrder({ order, index, showDetails = false }: DraggableOrderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 rounded-lg border border-border bg-background cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono text-primary truncate">
          {order.trackingCode}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {order.address}
        </p>
        {showDetails && (
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {order.locationName && (
              <span className="flex items-center gap-1 text-xs text-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                {order.locationName}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-foreground">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {format(new Date(order.deliveryTime), 'yyyy/MM/dd HH:mm')}
            </span>
          </div>
        )}
      </div>
      {!showDetails && (
        <div className="text-xs text-muted-foreground shrink-0">
          {format(new Date(order.deliveryTime), 'HH:mm')}
        </div>
      )}
    </div>
  );
}
