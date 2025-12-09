import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, Plus, Package, ArrowRight } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vehicle, Product, VehicleInventory } from "@shared/schema";

const vehicleFormSchema = z.object({
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  capacity: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleWithInventory extends Vehicle {
  inventory: (VehicleInventory & { product?: Product })[];
}

export default function Sell() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      vehicleNumber: "",
      vehicleType: "Truck",
      capacity: "",
      driverName: "",
      driverPhone: "",
    },
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const vehicleInventoryQueries = vehicles.map((vehicle) => ({
    vehicleId: vehicle.id,
    queryKey: ["/api/vehicles", vehicle.id, "inventory"],
  }));

  const { data: vehicleInventories = {} } = useQuery<Record<string, VehicleInventory[]>>({
    queryKey: ["/api/all-vehicle-inventories", vehicles.map((v) => v.id).join(",")],
    queryFn: async () => {
      if (vehicles.length === 0) return {};
      const results: Record<string, VehicleInventory[]> = {};
      await Promise.all(
        vehicles.map(async (vehicle) => {
          try {
            const res = await fetch(`/api/vehicles/${vehicle.id}/inventory`);
            if (res.ok) {
              results[vehicle.id] = await res.json();
            }
          } catch {
            results[vehicle.id] = [];
          }
        })
      );
      return results;
    },
    enabled: vehicles.length > 0,
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      return apiRequest("POST", "/api/vehicles", {
        number: data.vehicleNumber,
        type: data.vehicleType,
        capacity: data.capacity || null,
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Vehicle Created",
        description: "New vehicle has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create vehicle.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VehicleFormValues) => {
    createVehicleMutation.mutate(data);
  };

  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getProductUnit = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.unit || "Units";
  };

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/weighing?vehicleId=${vehicleId}`);
  };

  const getTotalItems = (inventory: VehicleInventory[]): number => {
    return inventory.filter((inv) => inv.quantity > 0).length;
  };

  const getTotalQuantity = (inventory: VehicleInventory[]): number => {
    return inventory.reduce((sum, inv) => sum + inv.quantity, 0);
  };

  if (vehiclesLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Sell</h1>
            <p className="text-muted-foreground">Select a vehicle to start selling</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Sell</h1>
          <p className="text-muted-foreground">Select a vehicle to start selling or add a new vehicle</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Card 
              className="hover-elevate cursor-pointer border-dashed border-2 flex items-center justify-center min-h-[200px]"
              data-testid="button-add-vehicle"
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium">Add New Vehicle</p>
                <p className="text-sm text-muted-foreground mt-1">Click to add a vehicle</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>Enter the vehicle details to add it to your fleet.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="vehicleNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MH12AB1234" {...field} data-testid="input-vehicle-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Truck">Truck</SelectItem>
                          <SelectItem value="Mini Truck">Mini Truck</SelectItem>
                          <SelectItem value="Tempo">Tempo</SelectItem>
                          <SelectItem value="Van">Van</SelectItem>
                          <SelectItem value="Pickup">Pickup</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Tons)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 5" {...field} data-testid="input-capacity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Driver name" {...field} data-testid="input-driver-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="driverPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Driver phone" {...field} data-testid="input-driver-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-vehicle">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createVehicleMutation.isPending} data-testid="button-submit-vehicle">
                    {createVehicleMutation.isPending ? "Creating..." : "Create Vehicle"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {vehicles.map((vehicle) => {
          const inventory = vehicleInventories[vehicle.id] || [];
          const itemsWithStock = inventory.filter((inv) => inv.quantity > 0);
          const hasInventory = itemsWithStock.length > 0;

          return (
            <Card
              key={vehicle.id}
              className="hover-elevate cursor-pointer"
              onClick={() => handleVehicleClick(vehicle.id)}
              data-testid={`card-vehicle-${vehicle.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant={hasInventory ? "default" : "secondary"}>
                    {hasInventory ? `${itemsWithStock.length} items` : "Empty"}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2" data-testid={`text-vehicle-number-${vehicle.id}`}>
                  {vehicle.number}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{vehicle.type}</p>
              </CardHeader>
              <CardContent>
                {hasInventory ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Products Loaded:</div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {itemsWithStock.slice(0, 3).map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{getProductName(inv.productId)}</span>
                          </div>
                          <span className="font-mono text-muted-foreground flex-shrink-0 ml-2">
                            {inv.quantity} {getProductUnit(inv.productId)}
                          </span>
                        </div>
                      ))}
                      {itemsWithStock.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{itemsWithStock.length - 3} more items</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    No products loaded
                  </div>
                )}
                <div className="flex items-center justify-end mt-4 text-sm text-primary">
                  <span>Start Selling</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Vehicles Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first vehicle to start managing sales
          </p>
        </div>
      )}
    </div>
  );
}
