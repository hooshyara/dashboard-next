export const PAZH_USER_API_BASE = 'https://id.api.pazh.net/api';

export const ADMIN_ONLY_PATHS = ['/reports', '/users', '/logs'] as const;

export type JwtPayload = {
  aclRole?: string;
  role?: string;
  userId?: number;
  [key: string]: unknown;
};

export type PazhUserProfile = {
  id?: number;
  name?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** دسترسی ادمین از `aclRole` (و در صورت نیاز `role`) داخل JWT. */
export function isAdminFromPayload(payload: JwtPayload | null): boolean {
  if (!payload) return false;
  const acl = String(payload.aclRole ?? '').toLowerCase();
  const role = String(payload.role ?? '').toLowerCase();
  return acl === 'admin' || acl === 'super-admin' || role === 'admin';
}

export function isAdminFromToken(token: string | undefined | null): boolean {
  if (!token) return false;
  return isAdminFromPayload(decodeJwtPayload(token));
}

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAuthToken(): string | null {
  return getCookie('token');
}

export function getAuthUserId(): number {
  const raw = getCookie('userId');
  const id = raw ? Number(raw) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('شناسه کاربر در کوکی یافت نشد. لطفاً دوباره وارد شوید.');
  }
  return id;
}

export function getAclRole(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const role = payload?.aclRole;
  return typeof role === 'string' ? role : null;
}

export function isAdminUser(): boolean {
  return isAdminFromToken(getAuthToken());
}

/** `GET https://id.api.pazh.net/api/user/:id` */
export async function fetchPazhUserProfile(
  userId?: number | number
): Promise<PazhUserProfile> {
  const token = getAuthToken();
  const res = await fetch(`${PAZH_USER_API_BASE}/user/${userId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`دریافت پروفایل کاربر: ${res.status} ${res.statusText}`);
  }
  const body: unknown = await res.json();
  if (body && typeof body === 'object' && 'data' in body) {
    const data = (body as { data: unknown }).data;
    if (data && typeof data === 'object') return data as PazhUserProfile;
  }
  if (body && typeof body === 'object') return body as PazhUserProfile;
  return {};
}
