'use client';

import { Search, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/components/auth/auth-provider';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { profile } = useAuth();
  const displayName =
    (typeof profile?.name === 'string' && profile.name) ||
    (typeof profile?.phone === 'string' && profile.phone) ||
    'کاربر';
  const displayEmail =
    (typeof profile?.email === 'string' && profile.email) ||
    (typeof profile?.phone === 'string' && profile.phone) ||
    '';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8 no-print">
      {/* Page title with gold accent */}
      <div className="hidden lg:flex items-center gap-3">
        <h1 className="text-xl font-bold text-primary">سامانه مدیریت لجستیک</h1>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className="lg:hidden mr-12 flex items-center gap-2">
        <h1 className="text-lg font-bold text-primary">مدیریت لجستیک</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجو..."
            className="w-64 pr-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                {displayEmail ? (
                  <p className="text-xs text-muted-foreground">{displayEmail}</p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>پروفایل</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">خروج</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
