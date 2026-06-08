'use client';

import type { ReactNode } from 'react';
import { usePermissions } from '@/components/auth/permission-provider';
import type { Permission } from '@/lib/types';

interface PermissionGateProps {
  /** دسترسی موردنیاز برای نمایش محتوا. */
  permission?: Permission;
  /** اگر چند دسترسی داده شود، داشتن حداقل یکی کافی است. */
  anyOf?: Permission[];
  /** محتوای جایگزین در صورت نبود دسترسی. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * محتوای فرزند را تنها در صورتی نمایش می‌دهد که کاربر دسترسی لازم را داشته باشد.
 * مدیر کل (ادمین) همیشه دسترسی دارد.
 */
export function PermissionGate({ permission, anyOf, fallback = null, children }: PermissionGateProps) {
  const { has, hasAny } = usePermissions();

  let allowed = true;
  if (permission) allowed = has(permission);
  else if (anyOf && anyOf.length > 0) allowed = hasAny(anyOf);

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
