'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  Menu,
  X,
  UserCog,
  FileText,
  History,
  MapPin,
  Boxes,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';

const navItems = [
  { href: '/', label: 'داشبورد', icon: LayoutDashboard, adminOnly: false },
  { href: '/drivers', label: 'رانندگان', icon: Users, adminOnly: false },
  { href: '/orders', label: 'سفارشات', icon: Package, adminOnly: false },
  { href: '/delivery', label: 'لیست ارسال', icon: Truck, adminOnly: false },
  { href: '/locations', label: 'مدیریت آدرس‌ها', icon: MapPin, adminOnly: false },
  { href: '/reports', label: 'گزارشات', icon: FileText, adminOnly: true },
  { href: '/logs', label: 'لاگ‌ها', icon: History, adminOnly: true },
  { href: '/users', label: 'کاربران', icon: UserCog, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden no-print"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-40 h-screen w-64 border-l border-sidebar-border bg-sidebar transition-transform lg:translate-x-0 no-print',
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Boxes className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary" style={{ fontFamily: 'system-ui' }}>
                  سامانه مدیریت لجستیک
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <p className="text-xs text-sidebar-foreground/50 text-center">
              نسخه ۱.۰.۰
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
