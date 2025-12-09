import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, Plus, Package, ArrowRight, X, Minus, Weight, ShoppingBag } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vehicle, Product, VehicleInventory, Vendor } from "@shared/schema";

const productItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0),
  bags: z.number().min(0).optional(),
});

const vehicleFormSchema = z.object({
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  capacity: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vendorId: z.string().optional(),
});

type ProductItem = z.infer<typeof productItemSchema>;
type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export default function Sell() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      vehicleNumber: "",
      vehicleType: "Truck",
      capacity: "",
      driverName: "",
      driverPhone: "",
      vendorId: "",
    },
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

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
      const vehicleResponse = await apiRequest("POST", "/api/vehicles", {
        number: data.vehicleNumber,
        type: data.vehicleType,
        capacity: data.capacity || null,
        driverName: data.driverName || null,
        driverPhone: data.driverPhone || null,
      });
      
      const vehicle = await vehicleResponse.json();
      
      const productsToLoad = selectedProducts.filter(p => p.quantity > 0);
      if (productsToLoad.length > 0 && vehicle.id) {
        const today = new Date().toISOString().split('T')[0];
        const vendorName = data.vendorId ? vendors.find(v => v.id === data.vendorId)?.name : null;
        
        for (const item of productsToLoad) {
          await apiRequest("POST", `/api/vehicles/${vehicle.id}/inventory`, {
            productId: item.productId,
            quantity: item.quantity,
          });
          
          await apiRequest("POST", "/api/vehicle-inventory-movements", {
            vehicleId: vehicle.id,
            productId: item.productId,
            type: "load",
            quantity: item.quantity,
            date: today,
            notes: vendorName ? `Loaded from ${vendorName}` : "Initial load",
          });
        }
      }
      
      return vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-vehicle-inventories"] });
      setIsDialogOpen(false);
      form.reset();
      setSelectedProducts([]);
      toast({
        title: "Vehicle Created",
        description: "New vehicle has been added with loaded products.",
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

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setSelectedProducts([]);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.productId === productId);
      if (exists) {
        return prev.filter((p) => p.productId !== productId);
      }
      return [...prev, { productId, quantity: 0, bags: 0 }];
    });
  };

  const updateProductQuantity = (productId: string, value: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, quantity: Math.max(0, value) } : p
      )
    );
  };

  const updateProductBags = (productId: string, value: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, bags: Math.max(0, Math.floor(value)) } : p
      )
    );
  };

  const getProduct = (productId: string): Product | undefined => {
    return products.find((p) => p.id === productId);
  };

  const getProductName = (productId: string): string => {
    return getProduct(productId)?.name || "Unknown Product";
  };

  const getProductUnit = (productId: string): string => {
    return getProduct(productId)?.unit || "Units";
  };

  const { totalWeight, totalBags } = useMemo(() => {
    let weight = 0;
    let bags = 0;
    
    for (const item of selectedProducts) {
      const product = getProduct(item.productId);
      if (!product) continue;
      
      const unit = product.unit?.toLowerCase() || "";
      if (unit === "kg" && item.quantity > 0) {
        weight += item.quantity;
      }
      bags += item.bags || 0;
    }
    
    return { totalWeight: weight, totalBags: bags };
  }, [selectedProducts, products]);

  useEffect(() => {
    if (totalWeight > 0) {
      const tons = (totalWeight / 1000).toFixed(2);
      form.setValue("capacity", tons);
    }
  }, [totalWeight, form]);

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/weighing?vehicleId=${vehicleId}`);
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
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
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
                <p className="text-sm text-muted-foreground mt-1">Click to add a vehicle with products</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>Enter the vehicle details and select products to load.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-vendor">
                              <SelectValue placeholder="Select vendor (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="driverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver Name</FormLabel>
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
                        <FormLabel>Driver Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Driver phone" {...field} data-testid="input-driver-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Weight className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Weight</p>
                      <p className="text-lg font-semibold" data-testid="text-total-weight">
                        {totalWeight.toFixed(1)} KG
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bags</p>
                      <p className="text-lg font-semibold" data-testid="text-total-bags">
                        {totalBags} Bags
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Select Products to Load</h3>
                    {selectedProducts.length > 0 && (
                      <Badge variant="secondary">{selectedProducts.length} selected</Badge>
                    )}
                  </div>
                  
                  <ScrollArea className="h-64 border rounded-md p-4">
                    <div className="space-y-3">
                      {products.map((product) => {
                        const isSelected = selectedProducts.some((p) => p.productId === product.id);
                        const productData = selectedProducts.find((p) => p.productId === product.id);
                        
                        return (
                          <div 
                            key={product.id} 
                            className={`p-3 border rounded-md transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleProduct(product.id)}
                                data-testid={`checkbox-product-${product.id}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{product.name}</span>
                                    <Badge variant="outline" className="text-xs">{product.unit}</Badge>
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-sm text-muted-foreground mb-1 block">
                                        Quantity ({product.unit})
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="outline"
                                          onClick={() => updateProductQuantity(product.id, (productData?.quantity || 0) - 1)}
                                          className="h-8 w-8"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                          type="number"
                                          min="0"
                                          step={product.unit === "KG" ? "0.1" : "1"}
                                          value={productData?.quantity || 0}
                                          onChange={(e) => updateProductQuantity(product.id, parseFloat(e.target.value) || 0)}
                                          className="text-center h-8 w-20"
                                          data-testid={`input-quantity-${product.id}`}
                                        />
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="outline"
                                          onClick={() => updateProductQuantity(product.id, (productData?.quantity || 0) + 1)}
                                          className="h-8 w-8"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1">
                                        <ShoppingBag className="h-3 w-3" />
                                        Bags
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="outline"
                                          onClick={() => updateProductBags(product.id, (productData?.bags || 0) - 1)}
                                          className="h-8 w-8"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={productData?.bags || 0}
                                          onChange={(e) => updateProductBags(product.id, parseInt(e.target.value) || 0)}
                                          className="text-center h-8 w-20"
                                          data-testid={`input-bags-${product.id}`}
                                        />
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="outline"
                                          onClick={() => updateProductBags(product.id, (productData?.bags || 0) + 1)}
                                          className="h-8 w-8"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleProduct(product.id)}
                                  className="text-muted-foreground"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {products.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No products available. Add products first.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} data-testid="button-cancel-vehicle">
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
