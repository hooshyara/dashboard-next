'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  fetchPazhUserProfile,
  getAuthUserId,
  getCookie,
  isAdminUser,
  type PazhUserProfile,
} from '@/lib/auth';

type AuthContextValue = {
  profile: PazhUserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<PazhUserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(() =>
    typeof window !== 'undefined' ? isAdminUser() : false
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const userId = getCookie('userId');
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(isAdminUser());
    try {
      const data = await fetchPazhUserProfile(userId);
      setProfile(data);
    } catch (e) {
      console.error(e);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (pathname === '/login') {
      setIsLoading(false);
      return;
    }

    if (!getCookie('userId') || !getCookie('token')) {
      setProfile(null);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const userId = getAuthUserId();
        setIsAdmin(isAdminUser());
        const data = await fetchPazhUserProfile(userId);
        if (!cancelled) setProfile(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, refreshProfile]);

  const value = useMemo(
    () => ({ profile, isAdmin, isLoading, refreshProfile }),
    [profile, isAdmin, isLoading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
