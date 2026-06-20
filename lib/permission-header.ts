import { getAuthUserId } from './auth';
import { normalizePermissions, PERMISSION_NAME_TO_ID } from './permissions';
import { getUserPermissions } from './services';
import type { Permission } from './types';

let cachedPermissions: Set<Permission> | null = null;

export async function getUserPermissionHeader(): Promise<string> {
  // اگه cache داری از store/context بخون، اینجا ساده‌ترین حالته
  const userId = getAuthUserId();
  if (!userId) return '';

  if (!cachedPermissions) {
    const raw = await getUserPermissions(userId);
    cachedPermissions = normalizePermissions(raw);
  }

  return [...cachedPermissions].join(',');
}

export function getPermissionHeader(permissions: Set<Permission>): string {
  return [...permissions].join(',');
}