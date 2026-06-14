import { AdminRouteGuard } from '@/components/auth/admin-route-guard';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
