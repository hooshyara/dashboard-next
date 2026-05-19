'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { User, UserRole, UserStatus, Permission, ROLE_PERMISSIONS } from '@/lib/types';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSave: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password?: string }) => void;
  onDelete?: (user: User) => void;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدیر سیستم',
  MANAGER: 'مدیر',
  OPERATOR: 'اپراتور',
  DRIVER: 'راننده',
};

const permissionLabels: Record<Permission, string> = {
  'driver:create': 'ایجاد راننده',
  'driver:read': 'مشاهده رانندگان',
  'driver:update': 'ویرایش راننده',
  'driver:delete': 'حذف راننده',
  'driver:filter': 'فیلتر رانندگان',
  'order:create': 'ثبت سفارش',
  'order:read': 'مشاهده سفارشات',
  'order:update': 'ویرایش سفارش',
  'order:delete': 'حذف سفارش',
  'order:filter': 'فیلتر سفارشات',
  'order:report': 'گزارش‌گیری سفارشات',
  'place:create': 'ثبت مکان/آدرس جدید',
  'place:read': 'مشاهده مکان‌ها',
  'place:update': 'ویرایش مکان',
  'place:delete': 'حذف مکان',
  'permission:create': 'ایجاد سطح دسترسی',
  'permission:read': 'مشاهده سطوح دسترسی',
  'permission:update': 'ویرایش سطح دسترسی',
  'permission:delete': 'حذف سطح دسترسی',
  'optimizer:run': 'اجرای بهینه‌ساز مسیر',
  'user:permission:update': 'ویرایش دسترسی‌های کاربر',
};

// Group permissions by category for better UI organization
const permissionGroups: { label: string; permissions: Permission[] }[] = [
  {
    label: 'رانندگان',
    permissions: ['driver:create', 'driver:read', 'driver:update', 'driver:delete', 'driver:filter'],
  },
  {
    label: 'سفارشات',
    permissions: ['order:create', 'order:read', 'order:update', 'order:delete', 'order:filter', 'order:report'],
  },
  {
    label: 'مکان‌ها',
    permissions: ['place:create', 'place:read', 'place:update', 'place:delete'],
  },
  {
    label: 'سطوح دسترسی',
    permissions: ['permission:create', 'permission:read', 'permission:update', 'permission:delete'],
  },
  {
    label: 'سایر',
    permissions: ['optimizer:run', 'user:permission:update'],
  },
];

const allPermissions: Permission[] = [
  'driver:create', 'driver:read', 'driver:update', 'driver:delete', 'driver:filter',
  'order:create', 'order:read', 'order:update', 'order:delete', 'order:filter', 'order:report',
  'place:create', 'place:read', 'place:update', 'place:delete',
  'permission:create', 'permission:read', 'permission:update', 'permission:delete',
  'optimizer:run', 'user:permission:update',
];

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSave,
  onDelete,
}: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    role: 'OPERATOR' as UserRole,
    status: 'ACTIVE' as UserStatus,
    permissions: [] as Permission[],
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        phone: user.phone,
        password: '',
        role: user.role,
        status: user.status,
        permissions: user.permissions,
      });
    } else {
      const defaultRole = 'OPERATOR' as UserRole;
      setFormData({
        name: '',
        username: '',
        phone: '',
        password: '',
        role: defaultRole,
        status: 'ACTIVE',
        permissions: ROLE_PERMISSIONS[defaultRole],
      });
    }
  }, [user, open]);

  const handleRoleChange = (role: UserRole) => {
    setFormData({
      ...formData,
      role,
      permissions: ROLE_PERMISSIONS[role],
    });
  };

  const handlePermissionToggle = (permission: Permission) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter((p) => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password?: string } = {
      name: formData.name,
      username: formData.username,
      phone: formData.phone,
      role: formData.role,
      status: formData.status,
      permissions: formData.permissions,
    };
    if (!user && formData.password) {
      userData.password = formData.password;
    }
    onSave(userData);
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (user && onDelete) {
      onDelete(user);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {user ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-foreground">نام</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="نام کاربر"
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-foreground">نام کاربری</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="نام کاربری"
                    className="bg-secondary border-border text-foreground"
                    dir="ltr"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-foreground">تلفن</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09123456789"
                    className="bg-secondary border-border text-foreground"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              {!user && (
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-foreground">رمز عبور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="رمز عبور"
                    className="bg-secondary border-border text-foreground"
                    dir="ltr"
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-foreground">نقش</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleRoleChange(value as UserRole)}
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="انتخاب نقش" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-foreground">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status" className="text-foreground">وضعیت</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as UserStatus })}
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="انتخاب وضعیت" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="ACTIVE" className="text-foreground">فعال</SelectItem>
                      <SelectItem value="INACTIVE" className="text-foreground">غیرفعال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">دسترسی‌ها</Label>
                <div className="p-3 bg-secondary rounded-lg border border-border max-h-[200px] overflow-y-auto">
                  {permissionGroups.map((group) => (
                    <div key={group.label} className="mb-4 last:mb-0">
                      <h4 className="text-sm font-semibold text-primary mb-2 border-b border-border pb-1">
                        {group.label}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {group.permissions.map((permission) => (
                          <div key={permission} className="flex items-center gap-2">
                            <Checkbox
                              id={permission}
                              checked={formData.permissions.includes(permission)}
                              onCheckedChange={() => handlePermissionToggle(permission)}
                              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label
                              htmlFor={permission}
                              className="text-sm text-foreground cursor-pointer"
                            >
                              {permissionLabels[permission]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-between">
              {user && onDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف کاربر
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-border"
                >
                  انصراف
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground">
                  {user ? 'ذخیره تغییرات' : 'افزودن'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              آیا مطمئن هستید؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              این کاربر حذف خواهد شد و قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-border">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
