// lib/permission-store.ts
import type { Permission } from './types';

/**
 * یه singleton ساده که PermissionProvider بهش می‌نویسه
 * و توابع API (services.ts) ازش می‌خونن.
 * چون services.ts نمی‌تونه از React context استفاده کنه،
 * این پل بین context و توابع plain TS هست.
 */
let _permissions: Set<Permission> = new Set();
let _isAdmin = false;

let _ready = false;
let _resolvers: (() => void)[] = [];

export const permissionStore = {
  set(permissions: Set<Permission>, isAdmin: boolean) {
    _permissions = permissions;
    _isAdmin = isAdmin;
    _ready = true;
    _resolvers.forEach(r => r());  // همه منتظرها رو آزاد کن
    _resolvers = [];
  },
  has(permission: Permission): boolean {
    if (_isAdmin) return true;
    return _permissions.has(permission);
  },
  waitUntilReady(): Promise<void> {
    if (_ready) return Promise.resolve();
    return new Promise(resolve => _resolvers.push(resolve));
  },
};