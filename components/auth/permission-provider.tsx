'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { getCookie, isAdminUser } from '@/lib/auth';
import { getUserPermissions } from '@/lib/services';
import { normalizePermissions } from '@/lib/permissions';
import type { Permission } from '@/lib/types';

type PermissionContextValue = {
  permissions: Set<Permission>;
  isLoading: boolean;
  isAdmin: boolean;
  /** آیا کاربر دسترسی مشخصی را دارد (ادمین همیشه true). */
  has: (permission: Permission) => boolean;
  /** آیا حداقل یکی از دسترسی‌ها را دارد. */
  hasAny: (perms: Permission[]) => boolean;
  refresh: () => Promise<void>;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const loadedForUser = useRef<string | null>(null);

  const load = useCallback(async () => {
    const userId = getCookie('userId');
    const token = getCookie('token');
    if (!userId || !token) {
      setPermissions(new Set());
      setIsAdmin(false);
      setIsLoading(false);
      loadedForUser.current = null;
      return;
    }

    const admin = isAdminUser();
    setIsAdmin(admin);

    setIsLoading(true);
    try {
      const raw = await getUserPermissions(Number(userId));
      const normalized = normalizePermissions(raw);
      console.log('[v0] loaded permissions:', Array.from(normalized));
      setPermissions(normalized);
      loadedForUser.current = userId;
    } catch (e) {
      console.error('[v0] failed to load permissions:', e);
      setPermissions(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname === '/login') {
      setIsLoading(false);
      return;
    }
    const userId = getCookie('userId');
    // فقط وقتی هنوز برای این کاربر بارگذاری نشده، دوباره fetch کن (کش بین صفحات)
    if (userId && loadedForUser.current === userId) {
      setIsLoading(false);
      return;
    }
    load();
  }, [pathname, load]);

  const has = useCallback(
    (permission: Permission) => {
      if (isAdmin) return true;
      return permissions.has(permission);
    },
    [isAdmin, permissions],
  );

  const hasAny = useCallback(
    (perms: Permission[]) => {
      if (isAdmin) return true;
      return perms.some((p) => permissions.has(p));
    },
    [isAdmin, permissions],
  );

  const value = useMemo(
    () => ({ permissions, isLoading, isAdmin, has, hasAny, refresh: load }),
    [permissions, isLoading, isAdmin, has, hasAny, load],
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return ctx;
}
