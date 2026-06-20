import type { Permission } from "./types";

/**
 * نگاشت شناسهٔ عددی دسترسی (مطابق بک‌اند) به نام دسترسی.
 * این نگاشت با گروه‌بندی فرم کاربران (`user-form-dialog`) هماهنگ است.
 */
export const PERMISSION_ID_TO_NAME: Record<number, Permission> = {
  1: "driver:create",
  2: "driver:read",
  3: "driver:update",
  4: "driver:delete",
  5: "driver:filter",
  6: "order:create",
  7: "order:read",
  8: "order:update",
  9: "order:delete",
  10: "order:filter",
  11: "order:report",
  12: "place:create",
  13: "place:read",
  14: "place:update",
  15: "place:delete",
  16: "permission:create",
  17: "permission:read",
  18: "permission:update",
  19: "permission:delete",
  20: "optimizer:run",
  21: "user:permission:update",
};

export const PERMISSION_NAME_TO_ID: Record<string, number> = Object.entries(
  PERMISSION_ID_TO_NAME,
).reduce(
  (acc, [id, name]) => {
    acc[name] = Number(id);
    return acc;
  },
  {} as Record<string, number>,
);

/** خطایی که هنگام نبود دسترسی پرتاب می‌شود تا فراخوانی API انجام نشود. */
export class PermissionDeniedError extends Error {
  permission: string;
  constructor(permission: string) {
    super(`دسترسی لازم برای این عملیات وجود ندارد: ${permission}`);
    this.name = "PermissionDeniedError";
    this.permission = permission;
  }
}

/**
 * پاسخ endpoint دسترسی‌ها می‌تواند شکل‌های مختلفی داشته باشد:
 * - آرایه‌ای از اعداد: [1, 2, 6]
 * - آرایه‌ای از رشته‌ها: ['order:read']
 * - آرایه‌ای از آبجکت: [{ id, name | permission | slug }]
 * - بسته‌بندی‌شده در { data | permissions | items }
 * این تابع همهٔ این حالت‌ها را به مجموعه‌ای از نام دسترسی‌ها نرمال می‌کند.
 */
export function normalizePermissions(raw: unknown): Set<Permission> {
  const result = new Set<Permission>();

  const pushFromValue = (value: unknown) => {
    if (value == null) return;

    // عدد → نام
    if (typeof value === "number") {
      const name = PERMISSION_ID_TO_NAME[value];
      if (name) result.add(name);
      return;
    }

    // رشتهٔ عددی یا نام دسترسی
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (/^\d+$/.test(trimmed)) {
        const name = PERMISSION_ID_TO_NAME[Number(trimmed)];
        if (name) result.add(name);
      } else if (trimmed in PERMISSION_NAME_TO_ID) {
        result.add(trimmed as Permission);
      }
      return;
    }

    // آبجکت با فیلدهای محتمل
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const id = obj.id ?? obj.permissionId ?? obj.permission_id;
      const name =
        obj.name ?? obj.permission ?? obj.slug ?? obj.key ?? obj.title;
      if (typeof id === "number" && PERMISSION_ID_TO_NAME[id]) {
        result.add(PERMISSION_ID_TO_NAME[id]);
        return;
      }
      if (
        typeof id === "string" &&
        /^\d+$/.test(id) &&
        PERMISSION_ID_TO_NAME[Number(id)]
      ) {
        result.add(PERMISSION_ID_TO_NAME[Number(id)]);
        return;
      }
      if (typeof name === "string" && name.trim() in PERMISSION_NAME_TO_ID) {
        result.add(name.trim() as Permission);
        return;
      }
      // ممکن است خود آبجکت permission تو در تو باشد
      if (obj.permission && typeof obj.permission === "object") {
        pushFromValue(obj.permission);
      }
    }
  };

  const unwrap = (input: unknown): unknown[] => {
    if (Array.isArray(input)) return input;
    if (input && typeof input === "object") {
      const obj = input as Record<string, unknown>;
      for (const key of ["data", "permissions", "items", "result", "results"]) {
        if (Array.isArray(obj[key])) return obj[key] as unknown[];
      }
      // برخی APIها یک آبجکت تکی برمی‌گردانند
      if (Array.isArray(obj.data)) return obj.data as unknown[];
    }
    return [];
  };

  for (const entry of unwrap(raw)) {
    pushFromValue(entry);
  }

  return result;
}

/**
 * فراخوانی محافظت‌شده: پیش از اجرای تابع شبکه، وجود دسترسی بررسی می‌شود.
 * در صورت نبود دسترسی، درخواست انجام نمی‌شود و خطای کنترل‌شده پرتاب می‌گردد.
 */
export async function guardedCall<T>(
  permission: Permission,
  fn: () => Promise<T>,
  hasPermission: (p: Permission) => boolean,
): Promise<T> {
  console.log("in");

  if (!hasPermission(permission)) {
    console.log("[v0] permission denied, blocking request for:", permission);
    throw new PermissionDeniedError(permission);
  }
  console.log("checked");
  return await fn();
}
