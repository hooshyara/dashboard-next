// Default coordinates - can be changed in one place
export const DEFAULT_DRIVER_LAT = 35.6892;
export const DEFAULT_DRIVER_LNG = 51.3890;

export interface Driver {
  id: number;
  name: string;
  car: string;
  lat: number;
  lng: number;
  capacity: number;
  priority: number; // 1-5
  description: string;
  isActive: boolean;
  orders?: Order[];
}

// User Management Types
export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'DRIVER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type Permission = 
  | 'VIEW_DASHBOARD'
  | 'MANAGE_DRIVERS'
  | 'MANAGE_ORDERS'
  | 'MANAGE_DELIVERY'
  | 'MANAGE_USERS'
  | 'VIEW_REPORTS'
  | 'EDIT_SETTINGS';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: ['VIEW_DASHBOARD', 'MANAGE_DRIVERS', 'MANAGE_ORDERS', 'MANAGE_DELIVERY', 'MANAGE_USERS', 'VIEW_REPORTS', 'EDIT_SETTINGS'],
  MANAGER: ['VIEW_DASHBOARD', 'MANAGE_DRIVERS', 'MANAGE_ORDERS', 'MANAGE_DELIVERY', 'VIEW_REPORTS'],
  OPERATOR: ['VIEW_DASHBOARD', 'MANAGE_ORDERS', 'MANAGE_DELIVERY'],
  DRIVER: ['VIEW_DASHBOARD'],
};

export interface User {
  id: number;
  name: string;
  username: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export type AssignType = 'AI' | 'MANUAL';

/** هم‌نام با enum بک‌اند Nest؛ مقادیر JSON کوچک‌حرف */
export enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  CANCEL = 'cancelled',
}

/** برچسب فارسی وضعیت سفارش (در UI). */
export const ORDER_STATUS_LABEL_FA: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'تخصیص داده نشده',
  [OrderStatus.ASSIGNED]: 'تخصیص داده شده',
  [OrderStatus.CANCEL]: 'لغو شده',
};

/**
 * راننده‌ای که در UI نشان داده می‌شود.
 * برای سفارش AI تا وقتی وضعیت `assigned` نشده، رانندهٔ اشتباه از پاسخ API نمایش داده نمی‌شود.
 */
export function getDisplayedOrderDriver(order: Order): Driver | null {
  if (order.status === OrderStatus.CANCEL) return null;
  if (!order.driver || !order.driverId) return null;
  if (order.assignType === 'AI' && order.status !== OrderStatus.ASSIGNED) return null;
  return order.driver;
}

export interface Order {
  id: number;
  trackingCode: string;
  address: string;
  assignType: AssignType;
  contactPerson: string;
  deliveryTime: Date;
  description: string | null;
  status: OrderStatus;
  mobile: string | null;
  locationName: string | null;
  returnTime: Date | null;
  productCode: string | null;
  lat: number | null;
  lng: number | null;
  /** شناسهٔ مکان مبدأ (Place) — در API: `pickupPlace` */
  pickupPlaceId: number | null;
  /** شناسهٔ مکان مقصد (Place) — در API: `dropoffPlace` */
  dropoffPlaceId: number | null;
  driver: Driver | null;
  driverId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryRoute {
  id: number;
  routeName: string;
  driver: Driver;
  orders: Order[];
  totalCapacity: number;
  deliverySequence: number[];
  timeWindow: {
    start: Date;
    end: Date;
  };
}

export interface TimeRangeFilter {
  startDate: Date;
  endDate: Date;
}

// Log Types
export type LogAction = 
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER'
  | 'DELETE_ORDER'
  | 'ASSIGN_DRIVER'
  | 'CREATE_DRIVER'
  | 'UPDATE_DRIVER'
  | 'DELETE_DRIVER'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER';

export type LogEntity = 'order' | 'driver' | 'user';

export interface Log {
  id: number;
  user: string;
  action: LogAction;
  entity: LogEntity;
  description: string;
  createdAt: Date;
}

// Location Types
export interface Location {
  id: number;
  title: string;
  address: string;
  lat: number;
  lng: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
