'use client';

import { DeliveryRoute } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns-jalali';

interface DeliveryRouteCardProps {
  route: DeliveryRoute;
}

export function DeliveryRouteCard({ route }: DeliveryRouteCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {route.routeName}
          </CardTitle>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            مسیر #{route.id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Driver Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="p-2 rounded-full bg-primary/20">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{route.driver.name}</p>
            <p className="text-sm ">{route.driver.car}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Package className="h-4 w-4 " />
            <div>
              <p className="text-xs ">تعداد سفارشات</p>
              <p className="font-semibold text-foreground">{route.orders.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Truck className="h-4 w-4 " />
            <div>
              <p className="text-xs ">ظرفیت استفاده شده</p>
              <p className="font-semibold text-foreground">
                {route.totalCapacity} / {route.driver.capacity}
              </p>
            </div>
          </div>
        </div>

        {/* Time Window */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
          <Clock className="h-4 w-4 " />
          <div className="flex-1">
            <p className="text-xs ">بازه زمانی تحویل</p>
            <p className="text-sm text-foreground">
              {format(new Date(route.timeWindow.start), 'HH:mm')} -{' '}
              {format(new Date(route.timeWindow.end), 'HH:mm')}
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">ترتیب تحویل:</p>
          <div className="space-y-2">
            {route.orders.map((order, index) => (
              <div
                key={order.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-primary truncate">
                    {order.id}
                  </p>
                  <p className="text-xs  truncate">
                    {order.address}
                  </p>
                </div>
                <div className="text-xs ">
                  {format(new Date(order.deliveryTime), 'HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
