'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:mr-64">
        <Header title={title} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
