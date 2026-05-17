import {
  DEFAULT_DRIVER_LAT,
  DEFAULT_DRIVER_LNG,
  DeliveryRoute,
  Driver,
  Location,
  Log,
  LogAction,
  LogEntity,
  Order,
  OrderStatus,
} from './types';

type UnknownRecord = Record<string, unknown>;

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : v != null ? String(v) : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  return fallback;
}

function parseDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  return new Date();
}

/** شناسه از مقدار عددی یا آبجکت `{ id }` (رابطهٔ TypeORM). */
function relationId(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'object' && v !== null && 'id' in v) {
    const id = num((v as UnknownRecord).id, NaN);
    return Number.isNaN(id) ? null : id;
  }
  return null;
}

function placeSnapshot(v: unknown): {
  title: string;
  address: string;
  lat: number | null;
  lng: number | null;
} | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as UnknownRecord;
  const title = str(p.title, '') || str(p.name, '');
  const address = str(p.address, '');
  return {
    title,
    address,
    lat: p.lat != null ? num(p.lat, 0) : null,
    lng: p.lng != null ? num(p.lng, 0) : null,
  };
}

function normalizeOrderStatusFromApi(raw: unknown): OrderStatus {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (
    v === OrderStatus.ASSIGNED ||
    v === 'ontheway' ||
    v === 'on_the_way' ||
    v === 'completed' ||
    v === 'in_transit'
  ) {
    return OrderStatus.ASSIGNED;
  }
  if (v === OrderStatus.CANCEL || v === 'cancelled' || v === 'canceled') {
    return OrderStatus.CANCEL;
  }
  if (v === OrderStatus.PENDING || v === 'pending' || v === '') {
    return OrderStatus.PENDING;
  }
  return OrderStatus.PENDING;
}

/** راننده از پاسخ API (camelCase یا فیلد active به‌جای isActive). */
export function normalizeDriver(raw: unknown): Driver {
  const d = raw as UnknownRecord;
  const id = num(d.id, 0);
  const active = d.active !== undefined ? bool(d.active, true) : bool(d.isActive, true);
  return {
    id,
    name: str(d.name, '—'),
    car: str(d.car, ''),
    lat: num(d.lat, DEFAULT_DRIVER_LAT),
    lng: num(d.lng, DEFAULT_DRIVER_LNG),
    capacity: num(d.capacity, 0),
    priority: Math.min(5, Math.max(1, Math.round(num(d.priority, 1)))),
    description: str(d.description, ''),
    isActive: active,
  };
}

export function normalizeOrder(raw: unknown): Order {
  const o = raw as UnknownRecord;
  const assignRaw = str(o.assignType, 'AI').toUpperCase();
  const assignType = assignRaw === 'MANUAL' ? 'MANUAL' : 'AI';

  const status = normalizeOrderStatusFromApi(o.status);

  const driverRaw = o.driver;
  let driver =
    driverRaw && typeof driverRaw === 'object'
      ? normalizeDriver(driverRaw)
      : null;
  if (driver && driver.id === 0) driver = null;

  let driverId: number | null = null;
  if (o.driverId != null) {
    const id = num(o.driverId, 0);
    if (id > 0) driverId = id;
  } else if (driver && driver.id > 0) {
    driverId = driver.id;
  }

  if (assignType === 'AI' && status === OrderStatus.PENDING) {
    driver = null;
    driverId = null;
  }

  const pickupRaw = o.pickupPlace ?? o.pickUpPlace;
  const dropoffRaw = o.dropoffPlace ?? o.dropOffPlace;
  const pickupPlaceId =
    relationId(pickupRaw) ??
    (o.pickupPlaceId != null ? relationId(o.pickupPlaceId) : null);
  const dropoffPlaceId =
    relationId(dropoffRaw) ??
    (o.dropoffPlaceId != null ? relationId(o.dropoffPlaceId) : null);

  const dropSnap = placeSnapshot(dropoffRaw);

  let address = str(o.address, '');
  let locationName = o.locationName != null ? str(o.locationName) : null;
  let lat = o.lat != null ? num(o.lat, DEFAULT_DRIVER_LAT) : null;
  let lng = o.lng != null ? num(o.lng, DEFAULT_DRIVER_LNG) : null;

  if (dropSnap) {
    if (!address) address = dropSnap.address;
    if (!locationName && dropSnap.title) locationName = dropSnap.title;
    if (lat == null && dropSnap.lat != null) lat = dropSnap.lat;
    if (lng == null && dropSnap.lng != null) lng = dropSnap.lng;
  }

  return {
    id: num(o.id, 0),
    trackingCode: str(o.trackingCode, ''),
    address,
    assignType: assignType as Order['assignType'],
    contactPerson: str(o.contactPerson, ''),
    deliveryTime: parseDate(o.deliveryTime),
    description: o.description != null ? str(o.description) : null,
    status,
    mobile: o.mobile != null ? str(o.mobile) : null,
    locationName,
    returnTime: o.returnTime != null ? parseDate(o.returnTime) : null,
    productCode: o.productCode != null ? str(o.productCode) : null,
    lat,
    lng,
    pickupPlaceId,
    dropoffPlaceId,
    driver,
    driverId,
    createdAt: parseDate(o.createdAt),
    updatedAt: parseDate(o.updatedAt),
  };
}

export function normalizeLocation(raw: unknown): Location {
  const l = raw as UnknownRecord;
  const title = str(l.title, '');
  const name = str(l.name, '');
  return {
    id: num(l.id, 0),
    title: title || name || '—',
    address: str(l.address, ''),
    lat: num(l.lat, 0),
    lng: num(l.lng, 0),
    description: l.description != null ? str(l.description) : null,
    createdAt: parseDate(l.createdAt),
    updatedAt: parseDate(l.updatedAt),
  };
}

const FALLBACK_DRIVER: Driver = {
  id: 0,
  name: '—',
  car: '',
  lat: DEFAULT_DRIVER_LAT,
  lng: DEFAULT_DRIVER_LNG,
  capacity: 0,
  priority: 1,
  description: '',
  isActive: true,
};

/** نرمال‌سازی پاسخ بهینه‌ساز / مسیر ارسال (ساختار ممکن است با بک‌اند فرق کند). */
export function normalizeDeliveryRoute(raw: unknown): DeliveryRoute {
  const r = raw as UnknownRecord;
  const driverRaw = r.driver;
  const driver =
    driverRaw && typeof driverRaw === 'object'
      ? normalizeDriver(driverRaw)
      : FALLBACK_DRIVER;

  const ordersRaw = r.orders;
  const orders = Array.isArray(ordersRaw)
    ? ordersRaw.map(normalizeOrder)
    : [];

  const tw = r.timeWindow as UnknownRecord | undefined;
  const startRaw = tw?.start ?? r.windowStart ?? r.start;
  const endRaw = tw?.end ?? r.windowEnd ?? r.end;

  const seqRaw = r.deliverySequence;
  const deliverySequence = Array.isArray(seqRaw)
    ? seqRaw.map((x) => num(x, 0)).filter((n) => n > 0)
    : orders.map((ord) => ord.id);

  return {
    id: num(r.id, 0),
    routeName: str(r.routeName, str(r.name, 'مسیر')),
    driver,
    orders,
    totalCapacity: num(r.totalCapacity, orders.length),
    deliverySequence,
    timeWindow: {
      start: startRaw != null ? parseDate(startRaw) : new Date(),
      end: endRaw != null ? parseDate(endRaw) : new Date(),
    },
  };
}

const BACKEND_ACTION_TO_LOG: Record<string, LogAction> = {
  'Order Created': 'CREATE_ORDER',
  'Order Update': 'UPDATE_ORDER',
  'Order Deleted': 'DELETE_ORDER',
  'Order Assigned': 'ASSIGN_DRIVER',
  'Driver Created': 'CREATE_DRIVER',
  'Driver Update': 'UPDATE_DRIVER',
  'Driver Deleted': 'DELETE_DRIVER',
};

function inferLogEntity(action: string): LogEntity {
  const lower = action.toLowerCase();
  if (lower.includes('order')) return 'order';
  if (lower.includes('driver')) return 'driver';
  if (lower.includes('user') || lower.includes('place')) return 'user';
  return 'order';
}

function mapBackendAction(action: string): LogAction {
  return BACKEND_ACTION_TO_LOG[action] ?? 'UPDATE_ORDER';
}

/** نرمال‌سازی رکورد `GET /logging/`. */
export function normalizeLog(raw: unknown): Log {
  const o = (raw && typeof raw === 'object' ? raw : {}) as UnknownRecord;
  const actionRaw = str(o.action, '');
  const userId = num(o.userId, 0);
  return {
    id: num(o.id, 0),
    user:
      o.user != null
        ? str(o.user)
        : userId > 0
          ? `کاربر #${userId}`
          : '—',
    action: mapBackendAction(actionRaw),
    entity: inferLogEntity(actionRaw),
    description: actionRaw || '—',
    createdAt: parseDate(o.createdAt),
  };
}

export function unwrapArray<T>(body: unknown, keys: string[]): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === 'object') {
    const o = body as UnknownRecord;
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}
