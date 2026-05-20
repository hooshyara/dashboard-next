"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { LocationsTable } from "@/components/locations/locations-table";
import { LocationFormDialog } from "@/components/locations/location-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MapPin } from "lucide-react";
import { Location } from "@/lib/types";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/lib/services";
import Cookies from "js-cookie";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  // const userId = Cookies.get("userId");

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    setLoading(true);
    const data = await getLocations();
    setLocations(data);
    setLoading(false);
  }

  // Filter locations based on search term
  const filteredLocations = locations.filter((location) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      location.name.toLowerCase().includes(search) ||
      location.address.toLowerCase().includes(search) ||
      (location.description &&
        location.description.toLowerCase().includes(search))
    );
  });
  

  function handleAddLocation() {
    setEditingLocation(null);
    setFormOpen(true);
  }

  function handleEditLocation(location: Location) {
    setEditingLocation(location);
    setFormOpen(true);
  }

  function handleDeleteClick(location: Location) {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (locationToDelete) {
      await deleteLocation(locationToDelete.id);
      setLocations(locations.filter((l) => l.id !== locationToDelete.id));
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  }

  // async function handleSaveLocation(
  //   locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> | Location
  // ) {
  //   if ('id' in locationData && 'createdAt' in locationData) {
  //     // Update existing location
  //     const updated = await updateLocation(locationData.id, locationData);
  //     setLocations(locations.map((l) => (l.id === updated.id ? updated : l)));
  //   } else {
  //     // Create new location
  //     const created = await createLocation(locationData);
  //     setLocations([...locations, created]);
  //   }
  // }
  async function handleSaveLocation(
    locationData: Omit<Location, "id" | "createdAt" | "updatedAt"> | Location,
  ) {
    const userId = Number(Cookies.get("userId")??0);

    if (!userId) {
      console.error("userId not found");
      return;
    }
    if ("id" in locationData && "createdAt" in locationData) {
      // Update existing location
      const updated = await updateLocation(locationData.id, {
        ...locationData,
        userId,
      });

      setLocations(locations.map((l) => (l.id === updated.id ? updated : l)));
    } else {
      // Create new location
      const created = await createLocation({
        ...locationData,
        userId,
      });

      setLocations([...locations, created]);
    }
  }

  return (
    <DashboardLayout title="مدیریت آدرس‌ها">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">مدیریت آدرس‌ها</CardTitle>
            <span className="text-sm text-muted-foreground">
              ({locations.length} آدرس)
            </span>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو..."
                className="bg-secondary border-border text-foreground pr-10 w-full sm:w-[200px]"
              />
            </div>
            <Button
              onClick={handleAddLocation}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 ml-2" />
              افزودن آدرس
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : (
            <>
              {searchTerm && filteredLocations.length !== locations.length && (
                <div className="text-sm text-muted-foreground mb-4">
                  {filteredLocations.length} نتیجه از {locations.length} آدرس
                </div>
              )}
              <LocationsTable
                locations={filteredLocations}
                onEdit={handleEditLocation}
                onDelete={handleDeleteClick}
              />
            </>
          )}
        </CardContent>
      </Card>

      <LocationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        location={editingLocation}
        onSave={handleSaveLocation}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              حذف آدرس
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              آیا مطمئن هستید که می‌خواهید آدرس «{locationToDelete?.name}» را
              حذف کنید؟ این عمل قابل بازگشت نیست و ممکن است بر سفارشات مرتبط
              تاثیر بگذارد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-border">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
