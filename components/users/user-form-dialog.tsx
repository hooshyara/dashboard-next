'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { User, UserStatus, Permission } from '@/lib/types';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSave: (user: { userId: number; phone: string; permissionIds: number[] }) => void;
  onDelete?: (user: User) => void;
}

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
const permissionGroups: { label: string; permissions: { id: number; name: Permission }[] }[] = [
  {
    label: 'رانندگان',
    permissions: [
      { id: 1, name: 'driver:create' },
      { id: 2, name: 'driver:read' },
      { id: 3, name: 'driver:update' },
      { id: 4, name: 'driver:delete' },
      { id: 5, name: 'driver:filter' },
    ],
  },
  {
    label: 'سفارشات',
    permissions: [
      { id: 6, name: 'order:create' },
      { id: 7, name: 'order:read' },
      { id: 8, name: 'order:update' },
      { id: 9, name: 'order:delete' },
      { id: 10, name: 'order:filter' },
      { id: 11, name: 'order:report' },
    ],
  },
  {
    label: 'مکان‌ها',
    permissions: [
      { id: 12, name: 'place:create' },
      { id: 13, name: 'place:read' },
      { id: 14, name: 'place:update' },
      { id: 15, name: 'place:delete' },
    ],
  },
  {
    label: 'سطوح دسترسی',
    permissions: [
      { id: 16, name: 'permission:create' },
      { id: 17, name: 'permission:read' },
      { id: 18, name: 'permission:update' },
      { id: 19, name: 'permission:delete' },
    ],
  },
  {
    label: 'سایر',
    permissions: [
      { id: 20, name: 'optimizer:run' },
      { id: 21, name: 'user:permission:update' },
    ],
  },
];

export function UserFormDialog({ open, onOpenChange, user, onSave, onDelete }: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    isActive: true as UserStatus,
    permissions: [] as number[],
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.nickname,
        username: user.username,
        phone: user.phone,
        password: '',
        isActive: user.isActive,
        permissions: user.permissions ?? [],
      });
    }
  }, [user, open]);

  const handlePermissionToggle = (permission: number) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter((p) => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      userId: user?.id ?? 0,
      permissionIds: formData?.permissions,
      phone: formData?.phone ?? '',
    };
    onSave(body);
    onOpenChange(false);
  };

  // const handleDeleteClick = () => {
  //   setDeleteDialogOpen(true);
  // };

  const handleConfirmDelete = () => {
    if (user && onDelete) {
      onDelete(user);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className='sm:max-w-[550px] bg-card border-border'>
          <DialogHeader>
            <DialogTitle className='text-foreground'>{user ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4 py-4'>
              <div className={`grid gap-2 ${!user ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {user ? (
                  <div className='grid gap-2'>
                    <Label
                      htmlFor='name'
                      className='text-foreground'
                    >
                      نام
                    </Label>
                    <Input
                      id='name'
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder='نام کاربر'
                      className='bg-secondary border-border text-foreground'
                      disabled
                    />
                  </div>
                ) : null}
                <div className='grid gap-2'>
                  <Label
                    htmlFor='phone'
                    className='text-foreground'
                  >
                    تلفن
                  </Label>
                  <Input
                    id='phone'
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder='9123456789'
                    className='bg-secondary border-border text-foreground'
                    dir='ltr'
                    disabled={Boolean(user)}
                  />
                </div>
              </div>
              <div className='grid gap-2'>
                <Label className='text-foreground'>دسترسی‌ها</Label>
                <div className='p-3 bg-secondary rounded-lg border border-border max-h-[200px] overflow-y-auto'>
                  {permissionGroups.map((group) => (
                    <div
                      key={group.label}
                      className='mb-4 last:mb-0'
                    >
                      <h4 className='text-sm font-semibold text-primary mb-2 border-b border-border pb-1'>
                        {group.label}
                      </h4>
                      <div className='grid grid-cols-2 gap-2'>
                        {group.permissions.map((permission) => (
                          <div
                            key={permission.name}
                            className='flex items-center gap-2'
                          >
                            <Checkbox
                              id={permission.name}
                              checked={formData.permissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                              className='border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                            />
                            <Label
                              htmlFor={permission.name}
                              className='text-sm text-foreground cursor-pointer'
                            >
                              {permissionLabels[permission.name]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className='flex flex-row justify-between gap-2 sm:justify-between'>
              {/* {user && onDelete ? (
              <Button
                type='button'
                variant='destructive'
                onClick={handleDeleteClick}
                className='flex items-center gap-2'
              >
                <Trash2 className='h-4 w-4' />
                حذف کاربر
              </Button>
            ) : (
              <div />
            )} */}
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  className='border-border'
                >
                  انصراف
                </Button>
                <Button
                  type='submit'
                  className='bg-primary text-primary-foreground'
                >
                  {user ? 'ذخیره تغییرات' : 'افزودن'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent className='bg-card border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-foreground'>آیا مطمئن هستید؟</AlertDialogTitle>
            <AlertDialogDescription className=''>این کاربر حذف خواهد شد و قابل بازگشت نیست.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='gap-2 sm:gap-0'>
            <AlertDialogCancel className='border-border'>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
