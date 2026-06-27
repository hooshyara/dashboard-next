import { AdminRouteGuard } from '@/components/auth/admin-route-guard';

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
