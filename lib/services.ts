import {
  DEFAULT_DRIVER_LAT,
  DEFAULT_DRIVER_LNG,
  DeliveryRoute,
  Driver,
  Order,
  OrderStatus,
  TimeRangeFilter,
  User,
  Log,
  Location,
} from './types';
import { BASE_URL } from './api-config';
import {
  normalizeDeliveryRoute,
  normalizeDriver,
  normalizeLocation,
  normalizeLog,
  normalizeOrder,
  unwrapArray,
} from './api-normalize';
import { getAuthUserId, isAdminUser, PAZH_USER_API_BASE } from './auth';
import Cookies from 'js-cookie';

export { BASE_URL } from './api-config';

const DRIVER_UPDATE_HEADERS = {
  'Content-Type': 'application/json',
  'x-permissions': 'driver:update',
} as const;

const DRIVER_FILTER_HEADERS = {
  'Content-Type': 'application/json',
  'x-permissions': 'driver:filter',
} as const;

const ORDER_UPDATE_HEADERS = {
  'Content-Type': 'application/json',
  'x-permissions': 'order:update',
} as const;

export type DriverFilterInput = {
  name: string;
  plateNumber: string;
  priority: number | null;
  minCapacity: number | null;
  maxCapacity: number | null;
};

export function hasDriverFilter(filters: DriverFilterInput): boolean {
  return !!(
    filters.name?.trim() ||
    filters.plateNumber?.trim() ||
    filters.priority !== null ||
    filters.minCapacity !== null ||
    filters.maxCapacity !== null
  );
}

function buildDriverFilterBody(filters: DriverFilterInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (filters.name?.trim()) body.name = filters.name.trim();
  if (filters.plateNumber?.trim()) body.plate = filters.plateNumber.trim();
  if (filters.priority !== null) body.priority = filters.priority;
  if (filters.minCapacity !== null) body.minCapacity = filters.minCapacity;
  if (filters.maxCapacity !== null) body.maxCapacity = filters.maxCapacity;
  return body;
}

export type OrderFilterInput = {
  placeId: string;
  driverId: number | null;
  trackingCode: string;
  startDate: Date | null;
  endDate: Date | null;
};

export function hasOrderFilter(filters: OrderFilterInput): boolean {
  return !!(
    filters.placeId?.trim() ||
    filters.driverId !== null ||
    filters.trackingCode?.trim() ||
    filters.startDate ||
    filters.endDate
  );
}

function appendOrderFilterQuery(params: URLSearchParams, filters: OrderFilterInput): void {
  const d = filters.placeId?.trim();
  if (d) params.append('placeId', d);
  if (filters.driverId !== null) params.append('driverId', String(filters.driverId));
  const tc = filters.trackingCode?.trim();
  if (tc) params.append('trackingCode', tc);
  if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
}

function mapOrderPartialToApi(order: Partial<Order>): Record<string, unknown> {
  const iso = (d: Date | null | undefined) => {
    if (d === undefined) return undefined;
    if (d === null) return null;
    return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
  };

  const p: Record<string, unknown> = {};
  if (order.address !== undefined) p.address = order.address;
  if (order.assignType !== undefined) p.assignType = order.assignType;
  if (order.contactPerson !== undefined) p.contactPerson = order.contactPerson;
  if (order.sender !== undefined) p.sender = order.sender;
  if (order.sender_mobile !== undefined) p.sender_mobile = order.sender_mobile;
  if (order.deliveryTime !== undefined) p.deliveryTime = iso(order.deliveryTime);
  if (order.description !== undefined) p.description = order.description;
  if (order.status !== undefined) p.status = order.status;
  if (order.mobile !== undefined) p.mobile = order.mobile;
  if (order.locationName !== undefined) p.locationName = order.locationName;
  if (order.returnTime !== undefined) {
    p.returnTime = order.returnTime === null ? null : iso(order.returnTime);
  }
  if (order.productCode !== undefined) p.productCode = order.productCode;
  if (order.lat !== undefined) p.lat = order.lat;
  if (order.lng !== undefined) p.lng = order.lng;
  if (order.driverId !== undefined) p.driverId = order.driverId;
  if (order.driver !== undefined) p.driverId = order.driver?.id ?? null;
  if (order.pickupPlaceId !== undefined) p.pickupPlace = order.pickupPlaceId;
  if (order.dropoffPlaceId !== undefined) p.dropoffPlace = order.dropoffPlaceId;
  return p;
}

// ============ DRIVER SERVICES ============

export async function filterDrivers(filters: DriverFilterInput): Promise<Driver[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const res = await fetch(`${BASE_URL}/drivers/filter?${params.toString()}`, {
    method: 'GET',
    headers: {
      ...DRIVER_FILTER_HEADERS,
      'x-permissions': 'driver:filter',
    },
  });

  if (!res.ok) {
    throw new Error(`drivers/filter: ${res.status} ${res.statusText}`);
  }

  const body: unknown = await res.json();

  const rows = unwrapArray<unknown>(body, ['data', 'drivers', 'items']);

  return rows.map(normalizeDriver);
}

export async function getActiveDrivers(): Promise<Driver[]> {
  const res = await fetch(`${BASE_URL}/drivers/active`, {
    headers: { 'x-permissions': 'driver:read' },
  });
  if (!res.ok) {
    throw new Error(`drivers/active: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  const rows = unwrapArray<unknown>(body, ['data', 'drivers', 'items']);
  return rows.map(normalizeDriver);
}

export async function getDrivers(): Promise<Driver[]> {
  const res = await fetch(`${BASE_URL}/drivers/`, {
    headers: { 'x-permissions': 'driver:read' },
  });
  if (!res.ok) {
    throw new Error(`drivers/: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  const rows = unwrapArray<unknown>(body, ['data', 'drivers', 'items']);
  return rows.map(normalizeDriver);
}

export async function getDriverById(id: number): Promise<Driver | null> {
  const res = await fetch(`${BASE_URL}/drivers/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`drivers/${id}: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  return normalizeDriver(body);
}

/** بدنهٔ `POST /drivers/` مطابق `CreateDriverDto` در Nest. */
export async function createDriver(driver: Omit<Driver, 'id'>): Promise<Driver> {
  const payload: Record<string, unknown> = {
    name: driver.name,
    car: driver.car,
    capacity: driver.capacity,
    active: driver.isActive ?? true,
    priority: driver.priority ?? 1,
    lat: driver.lat,
    userId: getAuthUserId(),
    lng: driver.lng,
  };
  if (driver.description) payload.description = driver.description;

  const res = await fetch(`${BASE_URL}/drivers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-permissions': 'driver:create',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`POST drivers/: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  return normalizeDriver(body);
}

export async function updateDriver(id: number, driver: Partial<Driver>): Promise<Driver> {
  const patch: Record<string, unknown> = {};
  if (driver.name !== undefined) patch.name = driver.name;
  if (driver.car !== undefined) patch.car = driver.car;
  if (driver.capacity !== undefined) patch.capacity = driver.capacity;
  if (driver.priority !== undefined) patch.priority = driver.priority;
  if (driver.description !== undefined) patch.description = driver.description;
  if (driver.lat !== undefined) patch.lat = driver.lat;
  if (driver.lng !== undefined) patch.lng = driver.lng;
  if (driver.isActive !== undefined) patch.active = driver.isActive;
  if (driver.userId !== undefined) patch.userId = driver.userId;

  const res = await fetch(`${BASE_URL}/drivers/${id}`, {
    method: 'PUT',
    headers: { ...DRIVER_UPDATE_HEADERS },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`PUT drivers/${id}: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  return normalizeDriver(body);
}

export async function deleteDriver(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/drivers/${id}`, {
    method: 'DELETE',
    headers: { ...DRIVER_UPDATE_HEADERS, 'x-permissions': 'driver:delete' },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DELETE drivers/${id}: ${res.status} ${res.statusText}`);
  }
}

// ============ ORDER SERVICES ============

export async function filterOrders(filters: OrderFilterInput): Promise<Order[]> {
  const params = new URLSearchParams();
  appendOrderFilterQuery(params, filters);
  const qs = params.toString();
  const url = qs ? `${BASE_URL}/orders/filter?${qs}` : `${BASE_URL}/orders/filter`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-permissions': 'order:filter',
    },
  });
  if (!res.ok) {
    throw new Error(`orders/filter: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  const rows = unwrapArray<unknown>(body, ['data', 'orders', 'items']);
  return rows.map(normalizeOrder);
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/orders`, {
    headers: {
      'Content-Type': 'application/json',
      'x-permissions': 'order:read',
    },
  });
  if (!res.ok) {
    throw new Error(`orders/: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  const rows = unwrapArray<unknown>(body, ['data', 'orders', 'items']);
  return rows.map(normalizeOrder);
}

export async function getOrderById(id: number): Promise<Order | null> {
  const res = await fetch(`${BASE_URL}/orders/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-permissions': 'order:read',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`orders/${id}: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  return normalizeOrder(body);
}

export async function createOrder(
  order: Omit<Order, 'id' | 'trackingCode' | 'createdAt' | 'updatedAt'>,
): Promise<Order> {
  const body: Record<string, unknown> = {
    pickupPlace: order.pickupPlaceId,
    dropoffPlace: order.dropoffPlaceId,
    assignType: order.assignType || 'AI',
    contactPerson: order.contactPerson,
    sender: order.sender ?? null,
    sender_mobile: order.sender_mobile ?? null,
    deliveryTime:
      order.deliveryTime instanceof Date
        ? order.deliveryTime.toISOString()
        : new Date(order.deliveryTime).toISOString(),
    description: order.description,
    status: order.status ?? OrderStatus.PENDING,
    mobile: order.mobile,
    returnTime:
      order.returnTime == null
        ? null
        : order.returnTime instanceof Date
          ? order.returnTime.toISOString()
          : new Date(order.returnTime).toISOString(),
    productCode: order.productCode,
    driverId: order.driverId ?? null,
    price: order.price ?? null,
    userId: getAuthUserId(),
  };

  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-permissions': 'order:create',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST orders: ${res.status} ${res.statusText}`);
  }
  const resBody: unknown = await res.json();
  return normalizeOrder(resBody);
}

export async function updateOrder(id: number, order: Partial<Order>): Promise<Order> {
  const patch = mapOrderPartialToApi(order);
  patch.userId = getAuthUserId();
  const res = await fetch(`${BASE_URL}/orders/${id}`, {
    method: 'PUT',
    headers: { ...ORDER_UPDATE_HEADERS },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`PUT orders/${id}: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  return normalizeOrder(body);
}

export async function deleteOrder(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/orders/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-permissions': 'order:delete',
    },
    body: JSON.stringify({ userId: getAuthUserId() }),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DELETE orders/${id}: ${res.status} ${res.statusText}`);
  }
}

/** `POST /orders/time` با فیلدهای `start` و `end` (ISO-8601). */
export async function fetchOrdersByTimeRange(start: Date, end: Date): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/orders/time`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-permissions': 'order:read',
    },
    body: JSON.stringify({
      start: start.toISOString(),
      end: end.toISOString(),
    }),
  });
  if (!res.ok) {
    throw new Error(`orders/time: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  const rows = unwrapArray<unknown>(body, ['data', 'orders', 'items']);
  return rows.map(normalizeOrder);
}

export async function getOrdersByTimeRange(filter: TimeRangeFilter): Promise<Order[]> {
  return fetchOrdersByTimeRange(filter.startDate, filter.endDate);
}

// ============ DELIVERY ROUTE SERVICES ============

/** بازهٔ پیش‌فرض برای بهینه‌ساز: امروز تا ۷ روز آینده. */
export function defaultOptimizerTimeRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

function orderDeliveryIso(order: Order): string {
  const d = order.deliveryTime;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

/** تطبیق سفارش کامل با آبجکت خلاصهٔ بهینه‌ساز (بدون id در پاسخ Nest). */
function pickOrderMatchingOptimizerSlice(opt: Record<string, unknown>, pool: Order[], used: Set<number>): Order | null {
  const deliveryTime =
    typeof opt.deliveryTime === 'string'
      ? opt.deliveryTime
      : opt.deliveryTime instanceof Date
        ? opt.deliveryTime.toISOString()
        : '';
  const contact = String(opt.contactPerson ?? '').trim();
  const lat = opt.lat != null ? Number(opt.lat) : null;
  const lng = opt.lng != null ? Number(opt.lng) : null;
  const addr = String(opt.address ?? '').trim();

  const available = pool.filter((o) => !used.has(o.id));

  const strict = available.find((ord) => {
    if (orderDeliveryIso(ord) !== deliveryTime) return false;
    if ((ord.contactPerson || '').trim() !== contact) return false;
    if (
      lat != null &&
      lng != null &&
      ord.lat != null &&
      ord.lng != null &&
      (Math.abs(ord.lat - lat) > 0.0002 || Math.abs(ord.lng - lng) > 0.0002)
    ) {
      return false;
    }
    if (addr && ord.address?.trim() && ord.address.trim() !== addr) return false;
    return true;
  });
  if (strict) {
    used.add(strict.id);
    return strict;
  }

  const loose = available.find(
    (ord) => orderDeliveryIso(ord) === deliveryTime && (ord.contactPerson || '').trim() === contact,
  );
  if (loose) {
    used.add(loose.id);
    return loose;
  }
  return null;
}

/**
 * پاسخ واقعی `POST /optimizer` در Nest: `{ assigned, unassigned, clusters }`.
 * آرایهٔ `assigned` را با سفارشات کامل از `orders/time` ادغام می‌کنیم.
 */
function buildDeliveryRoutesFromOptimizerResponse(
  body: { unassigned: Order[]; assigned: Driver[] },
  range: { start: Date; end: Date },
): DeliveryRoute[] {
  if (body && typeof body === 'object') {
    const assigned = (body as Record<string, unknown>).assigned;
    if (Array.isArray(assigned) && assigned.length > 0) {
      return assigned.map((row, routeIndex) => {
        const a = row as Record<string, unknown>;
        const driverName = String(a.driverName ?? '').trim();
        const capacity = Number(a.capacity ?? 0) || 0;
        const optOrders = Array.isArray(a.assignedOrders) ? a.assignedOrders : [];

        const resolved =
          body?.assigned?.find((d) => d?.driverName?.trim() === driverName) ??
          ({
            id: 0,
            name: driverName || '—',
            car: '',
            lat: Number(a.lat ?? DEFAULT_DRIVER_LAT),
            lng: Number(a.lng ?? DEFAULT_DRIVER_LNG),
            capacity: capacity || 0,
            priority: Math.min(5, Math.max(1, Math.round(Number(a.priority ?? 1)))),
            description: '',
            isActive: true,
          } as Driver);

        const driver: Driver = {
          ...resolved,
          capacity: capacity || resolved.capacity,
          lat: Number(a.lat ?? resolved.lat),
          lng: Number(a.lng ?? resolved.lng),
          priority: Math.min(5, Math.max(1, Math.round(Number(a.priority ?? resolved.priority)))),
        };

        const twStart =
          optOrders.length > 0
            ? new Date(Math.min(...optOrders.map((o) => new Date(o.deliveryTime).getTime())))
            : range.start;
        const twEnd =
          optOrders.length > 0
            ? new Date(Math.max(...optOrders.map((o) => new Date(o.deliveryTime).getTime())))
            : range.end;

        const orders: Order[] = optOrders.map((o) => ({
          ...o,
          driverId: driver.id,
          driver,
        }));

        return {
          id: routeIndex + 1,
          routeName: `مسیر ${routeIndex + 1}`,
          driver,
          orders,
          totalCapacity: orders.length,
          deliverySequence: orders.map((o) => o.id),
          timeWindow: { start: twStart, end: twEnd },
        };
      });
    }
  }

  const rows = unwrapArray<unknown>(body, ['data', 'routes', 'items', 'deliveryRoutes']);
  return rows.map(normalizeDeliveryRoute);
}

/** سفارشات بازه + مسیرهای بهینه‌ساز (یک بار شبکه، سازگار با شکل پاسخ Nest). */
export async function getDeliveryRoutes(
  range: { start: Date; end: Date } = defaultOptimizerTimeRange(),
  isNeshanOptimizer?: boolean,
): Promise<{ orders: Order[]; routes: DeliveryRoute[] }> {
  const res = await fetch(`${BASE_URL}${!isNeshanOptimizer ? '/optimizer/time' : '/optimizer/preview'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      ...(isNeshanOptimizer ? { lat: DEFAULT_DRIVER_LAT, lng: DEFAULT_DRIVER_LNG } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`POST optimizer: ${res.status} ${res.statusText}`);
  }
  const body: { unassigned: Order[]; assigned: Driver[] } = await res.json();
  const sorted = body?.unassigned?.sort(
    (a, b) => new Date(a.deliveryTime).getTime() - new Date(b.deliveryTime).getTime(),
  );
  const routes = buildDeliveryRoutesFromOptimizerResponse(body, range);
  console.log('routes: ', routes);
  console.log('sorted: ', sorted);
  return { orders: sorted, routes };
}

/**
 * مطابق `AssignOrdersDto` در Nest: هر درخواست `POST /orders/assign` شامل
 * `orderIds: number[]` و `driverId: number` به‌علاوهٔ `userId` برای لاگ.
 */
export type DeliveryRouteAssignmentPayload = {
  assignments: { driverId: number; orderIds: number[] }[];
};

function normalizeAssignmentPayload(
  payload: DeliveryRouteAssignmentPayload,
): { driverId: number; orderIds: number[] }[] {
  const cleaned = [...payload.assignments]
    .map((a) => ({
      driverId: Number(a.driverId),
      orderIds: [...a.orderIds].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
    }))
    .filter((a) => a.driverId > 0 && a.orderIds.length > 0);

  const byDriver = new Map<number, Set<number>>();
  for (const a of cleaned) {
    if (!byDriver.has(a.driverId)) byDriver.set(a.driverId, new Set());
    const set = byDriver.get(a.driverId)!;
    for (const id of a.orderIds) set.add(id);
  }

  return [...byDriver.entries()]
    .map(([driverId, set]) => ({
      driverId,
      orderIds: [...set].sort((x, y) => x - y),
    }))
    .sort((x, y) => x.driverId - y.driverId);
}

export function buildDeliveryRouteAssignmentPayload(routes: DeliveryRoute[]): DeliveryRouteAssignmentPayload {
  const assignments = routes.map((r) => {
    const driverId = Number(r.driver?.driverId);
    const orderIds = r.orders.map((o) => Number(o.id)).filter((id) => Number.isFinite(id) && id > 0);
    return { driverId, orderIds };
  });
  return { assignments: normalizeAssignmentPayload({ assignments }) };
}

export function deliveryRouteAssignmentsEqual(
  a: DeliveryRouteAssignmentPayload,
  b: DeliveryRouteAssignmentPayload,
): boolean {
  const na = normalizeAssignmentPayload(a);
  const nb = normalizeAssignmentPayload(b);
  if (na.length !== nb.length) return false;
  for (let i = 0; i < na.length; i++) {
    const ra = na[i];
    const rb = nb[i];
    if (ra.driverId !== rb.driverId || ra.orderIds.length !== rb.orderIds.length) return false;
    for (let j = 0; j < ra.orderIds.length; j++) {
      if (ra.orderIds[j] !== rb.orderIds[j]) return false;
    }
  }
  return true;
}

export async function saveDeliveryRouteAssignments(payload: DeliveryRouteAssignmentPayload): Promise<void> {
  const headers = {
    'Content-Type': 'application/json',
    'x-permissions': 'optimizer:run',
  } as const;

  const list = normalizeAssignmentPayload(payload);
  if (list.length === 0) return;

  for (const { driverId, orderIds } of list) {
    const res = await fetch(`${BASE_URL}/orders/assign`, {
      method: 'POST',
      headers: { ...headers },
      body: JSON.stringify({
        userId: getAuthUserId(),
        driverId,
        orderIds,
      }),
    });
    if (!res.ok) {
      let detail = '';
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
      throw new Error(`POST orders/assign: ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`);
    }
  }
}

// ============ USER PERMISSIONS SERVICES ============

export async function getUserPermissions(id: number) {
  return await fetch(`${BASE_URL}/users/permissions/${id}`).then((res) => res.json());
}

export async function getAllUserPermissions(id: number) {
  return await fetch(`${BASE_URL}/users/permissions`).then((res) => res.json());
}

export async function getUserAllPermissions(userId: number, permissionId: number) {
  const data = { userId, permissionId };
  return await fetch(`${BASE_URL}/users/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

// ============ USER SERVICES ============

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${BASE_URL}/users`, { cache: 'no-store' });
  const json = await res.json();
  return Array.isArray(json) ? json : [];
  // const { mockUsers } = await import("./mock-data");
  // return Promise.resolve(mockUsers);
}

export async function getUserById(id: number): Promise<User | null> {
  // TODO: Replace with actual API call
  // return fetch(`${API_BASE_URL}/users/${id}`).then(res => res.json());
  const { mockUsers } = await import('./mock-data');
  return Promise.resolve(mockUsers.find((u) => u.id === id) || null);
}

export async function createUser(user: { phone: string; permissionIds: number[] }): Promise<User> {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    body: JSON.stringify(user),
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  return json;
}

export async function updateUser(id: number, user: Partial<User>): Promise<User> {
  // TODO: Replace with actual API call
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/permissions/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).then((res) => res.json());
  // const { mockUsers } = await import("./mock-data");
  // const existingUser = mockUsers.find((u) => u.id === id);
  // return Promise.resolve({
  //   ...existingUser,
  //   ...user,
  //   updatedAt: new Date(),
  // } as User);
}

export async function deleteUser(id: number) {
  // TODO: Replace with actual API call
  return fetch(`${process.env.NEXT_PUBLIC_REDIRECT_URL}/users/${id}`, {
    method: 'DELETE',
  });
}

// ============ LOG SERVICES ============

export async function getLogs(): Promise<Omit<Log, 'mobile'>[]> {
  if (!isAdminUser()) {
    return [];
  }
  const res = await fetch(`${BASE_URL}/logging/`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`GET logging/: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  const rows = unwrapArray<unknown>(body, ['data', 'logs', 'items']);
  return rows.map(normalizeLog);
}

// ============ LOCATION SERVICES (places) ============

const PLACE_READ_HEADERS = {
  'Content-Type': 'application/json',
  'x-permissions': 'place:read',
} as const;

const PLACE_CREATE_HEADERS = {
  'Content-Type': 'application/json',
  'x-permissions': 'place:create',
} as const;

const PLACE_UPDATE_HEADERS = {
  'Content-Type': 'application/json',
  'x-permissions': 'place:update',
} as const;

const PLACE_DELETE_HEADERS = {
  'Content-Type': 'application/json',
  'x-permissions': 'place:delete',
} as const;

export async function getLocations(): Promise<Location[]> {
  const res = await fetch(`${BASE_URL}/places/`, {
    headers: { ...PLACE_READ_HEADERS },
  });
  if (!res.ok) {
    throw new Error(`places/: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  const rows = unwrapArray<unknown>(body, ['data', 'places', 'items', 'locations']);
  return rows.map(normalizeLocation);
}

export async function getLocationById(id: number): Promise<Location | null> {
  const res = await fetch(`${BASE_URL}/places/${id}`, {
    headers: { ...PLACE_READ_HEADERS },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`places/${id}: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  return normalizeLocation(body);
}

export async function createLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
  const res = await fetch(`${BASE_URL}/places/`, {
    method: 'POST',
    headers: { ...PLACE_CREATE_HEADERS },
    body: JSON.stringify({
      name: location.name,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      description: location.description ?? null,
      userId: location.userId,
    }),
  });
  if (!res.ok) {
    throw new Error(`POST places/: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  return normalizeLocation(body);
}

export async function updateLocation(id: number, location: Partial<Location>): Promise<Location> {
  const payload: Record<string, unknown> = {};
  if (location.name !== undefined) payload.name = location.name;
  if (location.address !== undefined) payload.address = location.address;
  if (location.lat !== undefined) payload.lat = location.lat;
  if (location.lng !== undefined) payload.lng = location.lng;
  if (location.description !== undefined) payload.description = location.description;
  if (location.userId !== undefined) payload.userId = location.userId;

  const res = await fetch(`${BASE_URL}/places/${id}`, {
    method: 'PUT',
    headers: { ...PLACE_UPDATE_HEADERS },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`PUT places/${id}: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  return normalizeLocation(body);
}

export async function deleteLocation(id: number): Promise<void> {
  const userId = Cookies.get('userId');
  const res = await fetch(`${BASE_URL}/places/${id}`, {
    method: 'DELETE',
    headers: { ...PLACE_DELETE_HEADERS },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DELETE places/${id}: ${res.status} ${res.statusText}`);
  }
}
