'use client';

import { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Power } from 'lucide-react';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدیر سیستم',
  MANAGER: 'مدیر',
  OPERATOR: 'اپراتور',
  DRIVER: 'راننده',
};

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-primary/20 text-primary border-primary/30',
  MANAGER: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  OPERATOR: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  DRIVER: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
};

export function UsersTable({ users, onEdit }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='rounded-full bg-muted p-4 mb-4'>
          <svg
            className='h-8 w-8 '
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-foreground'>کاربری یافت نشد</h3>
        <p className='text-sm  mt-1'>با کلیک روی دکمه «افزودن کاربر» یک کاربر جدید اضافه کنید.</p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border border-border overflow-hidden'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/50 hover:bg-muted/50'>
            <TableHead className='text-right text-foreground'>ردیف</TableHead>
            <TableHead className='text-right text-foreground'>شناسه</TableHead>
            <TableHead className='text-right text-foreground'>نام</TableHead>
            <TableHead className='text-right text-foreground'>تلفن</TableHead>
            <TableHead className='text-right text-foreground'>نقش</TableHead>
            <TableHead className='text-right text-foreground'>عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow
              key={user.id}
              className='hover:bg-muted/30'
            >
              <TableCell className='text-right font-mono '>{index + 1}</TableCell>
              <TableCell className='text-right font-mono '>{user.id}</TableCell>
              <TableCell className='text-right font-medium text-foreground'>{user.nickname}</TableCell>

              <TableCell className='text-right text-foreground'>
                <span
                  dir='ltr'
                  className='inline-block font-mono text-sm'
                >
                  {user.phone}
                </span>
              </TableCell>
              <TableCell className='text-right'>
                <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
              </TableCell>
              {/* <TableCell className="text-right">
                <Badge
                  className={
                    user.isActive === true
                      ? 'bg-success/20 text-success border-success/30'
                      : 'bg-destructive/20 text-destructive border-destructive/30'
                  }
                >
                  {user.isActive === true ? 'فعال' : 'غیرفعال'}
                </Badge>
              </TableCell> */}
              <TableCell className='text-right'>
                <div className='flex items-center justify-start gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => onEdit(user)}
                    className='h-8 w-8  hover:text-foreground'
                  >
                    <Pencil className='h-4 w-4' />
                  </Button>
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus(user)}
                    className={`h-8 w-8 ${
                      user.isActive === true
                        ? 'text-success hover:text-success/80'
                        : 'text-destructive hover:text-destructive/80'
                    }`}
                    title={user.isActive === true ? 'غیرفعال کردن' : 'فعال کردن'}
                  >
                    <Power className="h-4 w-4" />
                  </Button> */}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
