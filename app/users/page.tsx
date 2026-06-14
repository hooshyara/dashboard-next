'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { UsersTable } from '@/components/users/users-table';
import { UserFormDialog } from '@/components/users/user-form-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { User } from '@/lib/types';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/services';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  }

  function handleAddUser() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function handleEditUser(user: User) {
    setEditingUser(user);
    setFormOpen(true);
  }

  async function handleDeleteUser(user: User) {
    await deleteUser(user.id);
    setUsers(users.filter((u) => u.id !== user.id));
  }

  async function handleSaveUser(userData: { userId: number; phone: string; permissionIds: number[] }) {
    if (editingUser) {
      // Update existing user
      const body = {
        userId: userData?.userId,
        permissionIds: userData?.permissionIds,
      };
      const updated = await updateUser(editingUser.id, body);
      setUsers(users?.map((u) => (u.id === updated.id ? updated : u)));
    } else {
      // Create new user
      const body = {
        phone: userData?.phone,
        permissionIds: userData?.permissionIds,
      };
      const created = await createUser(body);
      setUsers([...users, created]);
    }
  }

  return (
    <DashboardLayout title='کاربران'>
      <Card className='bg-card border-border'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-foreground'>مدیریت کاربران</CardTitle>
          <Button
            onClick={handleAddUser}
            className='bg-primary text-primary-foreground'
          >
            <Plus className='h-4 w-4 ml-2' />
            افزودن کاربر
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-16'>
              <div className=''>در حال بارگذاری...</div>
            </div>
          ) : (
            <UsersTable
              users={users}
              onEdit={handleEditUser}
            />
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
      />
    </DashboardLayout>
  );
}
