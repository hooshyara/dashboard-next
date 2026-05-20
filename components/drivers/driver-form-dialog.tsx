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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { Driver, DEFAULT_DRIVER_LAT, DEFAULT_DRIVER_LNG } from '@/lib/types';

interface DriverFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver | null;
  onSave: (driver: Omit<Driver, 'id'> | Driver) => void;
  onDelete?: (driver: Driver) => void;
}

export function DriverFormDialog({
  open,
  onOpenChange,
  driver,
  onSave,
  onDelete,
}: DriverFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    car: '',
    capacity: 0,
    priority: 1,
    description: '',
    isActive: true,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        car: driver.car,
        capacity: driver.capacity,
        priority: driver.priority || 1,
        description: driver.description,
        isActive: driver.isActive ?? true,
      });
    } else {
      setFormData({
        name: '',
        car: '',
        capacity: 0,
        priority: 1,
        description: '',
        isActive: true,
      });
    }
  }, [driver, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (driver) {
      onSave({
        ...formData,
        id: driver.id,
        lat: DEFAULT_DRIVER_LAT,
        lng: DEFAULT_DRIVER_LNG,
        isActive: formData.isActive,
      });
    } else {
      onSave({
        ...formData,
        lat: DEFAULT_DRIVER_LAT,
        lng: DEFAULT_DRIVER_LNG,
        isActive: true,
      });
    }
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (driver && onDelete) {
      onDelete(driver);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {driver ? 'ویرایش راننده' : 'افزودن راننده جدید'}
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
                  placeholder="نام راننده"
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="car" className="text-foreground">خودرو</Label>
                <Input
                  id="car"
                  value={formData.car}
                  onChange={(e) => setFormData({ ...formData, car: e.target.value })}
                  placeholder="مدل خودرو"
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="capacity" className="text-foreground">ظرفیت</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                    }
                    placeholder="ظرفیت حمل بار"
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority" className="text-foreground">اولویت راننده</Label>
                  <Select
                    value={formData.priority.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="انتخاب اولویت" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="1" className="text-foreground">1 - بالاترین</SelectItem>
                      <SelectItem value="2" className="text-foreground">2</SelectItem>
                      <SelectItem value="3" className="text-foreground">3 - متوسط</SelectItem>
                      <SelectItem value="4" className="text-foreground">4</SelectItem>
                      <SelectItem value="5" className="text-foreground">5 - پایین‌ترین</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-foreground">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="توضیحات اضافی"
                  className="bg-secondary border-border text-foreground"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-between">
              {driver && onDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف راننده
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
                  {driver ? 'ذخیره تغییرات' : 'افزودن'}
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
              این راننده حذف خواهد شد و قابل بازگشت نیست.
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
