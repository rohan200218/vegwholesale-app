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
import { Truck, Plus, Package, X, Minus, Weight, ShoppingBag, User, Calculator, Scale } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vehicle, Product, VehicleInventory, Vendor, Customer } from "@shared/schema";

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

interface SaleProduct {
  productId: string;
  productName: string;
  unit: string;
  weight: number;
  bags: number;
  available: number;
}

export default function Sell() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);
  
  // Customer Sale State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [saleProducts, setSaleProducts] = useState<SaleProduct[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [hamaliRate, setHamaliRate] = useState<number>(12);

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

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
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

  // Customer Sale Functions
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const selectedVehicleInventory = selectedVehicleId ? (vehicleInventories[selectedVehicleId] || []) : [];

  const handleVehicleSelect = (vehicleId: string) => {
    if (selectedVehicleId === vehicleId) {
      setSelectedVehicleId(null);
      setSaleProducts([]);
      return;
    }
    
    setSelectedVehicleId(vehicleId);
    setSaleProducts([]);
    setCustomerName("");
    setSelectedCustomerId("");
  };

  const toggleSaleProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const inventory = selectedVehicleInventory.find(i => i.productId === productId);
    if (!product || !inventory) return;

    setSaleProducts(prev => {
      const exists = prev.find(p => p.productId === productId);
      if (exists) {
        return prev.filter(p => p.productId !== productId);
      }
      return [...prev, {
        productId,
        productName: product.name,
        unit: product.unit || "Units",
        weight: 0,
        bags: 0,
        available: inventory.quantity,
      }];
    });
  };

  const updateSaleProductWeight = (productId: string, weight: number) => {
    setSaleProducts(prev =>
      prev.map(p =>
        p.productId === productId ? { ...p, weight: Math.max(0, weight) } : p
      )
    );
  };

  const updateSaleProductBags = (productId: string, bags: number) => {
    setSaleProducts(prev =>
      prev.map(p =>
        p.productId === productId ? { ...p, bags: Math.max(0, Math.floor(bags)) } : p
      )
    );
  };

  const saleTotalBags = useMemo(() => {
    return saleProducts.reduce((sum, p) => sum + p.bags, 0);
  }, [saleProducts]);

  const totalHamaliCharge = useMemo(() => {
    return saleTotalBags * hamaliRate;
  }, [saleTotalBags, hamaliRate]);

  const saleTotalWeight = useMemo(() => {
    return saleProducts.reduce((sum, p) => sum + p.weight, 0);
  }, [saleProducts]);

  const handleCustomerChange = (value: string) => {
    if (value === "new") {
      setSelectedCustomerId("");
    } else {
      setSelectedCustomerId(value);
      const customer = customers.find(c => c.id === value);
      if (customer) {
        setCustomerName(customer.name);
      }
    }
  };

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVehicleId || saleProducts.length === 0) {
        throw new Error("Please select products to sell");
      }

      // Create or get customer
      let customerId = selectedCustomerId;
      if (!customerId && customerName.trim()) {
        const customerRes = await apiRequest("POST", "/api/customers", {
          name: customerName.trim(),
        });
        const newCustomer = await customerRes.json();
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error("Please select or enter a customer name");
      }

      // Calculate totals
      const subtotal = saleProducts.reduce((sum, p) => {
        const product = products.find(pr => pr.id === p.productId);
        return sum + (p.weight * (product?.salePrice || 0));
      }, 0);

      const today = new Date().toISOString().split('T')[0];
      const invoiceNumber = `INV-${Date.now()}`;

      // Build invoice items
      const items = saleProducts.map(saleProduct => {
        const product = products.find(p => p.id === saleProduct.productId);
        return {
          productId: saleProduct.productId,
          quantity: saleProduct.weight,
          unitPrice: product?.salePrice || 0,
          total: saleProduct.weight * (product?.salePrice || 0),
        };
      });

      // Create invoice with items
      const invoiceRes = await apiRequest("POST", "/api/invoices", {
        invoiceNumber,
        customerId,
        vehicleId: selectedVehicleId,
        date: today,
        subtotal,
        includeHamaliCharge: true,
        hamaliRatePerKg: hamaliRate,
        hamaliChargeAmount: totalHamaliCharge,
        hamaliPaidByCash: false,
        totalKgWeight: saleTotalWeight,
        grandTotal: subtotal + totalHamaliCharge,
        items,
      });

      const invoice = await invoiceRes.json();

      // Update vehicle inventory
      for (const saleProduct of saleProducts) {

        // Update vehicle inventory
        const currentInventory = selectedVehicleInventory.find(i => i.productId === saleProduct.productId);
        if (currentInventory) {
          const newQuantity = Math.max(0, currentInventory.quantity - saleProduct.weight);
          await apiRequest("PATCH", `/api/vehicles/${selectedVehicleId}/inventory/${saleProduct.productId}`, {
            quantity: newQuantity,
          });

          await apiRequest("POST", "/api/vehicle-inventory-movements", {
            vehicleId: selectedVehicleId,
            productId: saleProduct.productId,
            type: "sale",
            quantity: saleProduct.weight,
            date: today,
            notes: `Sold to ${customerName}`,
          });
        }
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-vehicle-inventories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      setSelectedVehicleId(null);
      setSaleProducts([]);
      setCustomerName("");
      setSelectedCustomerId("");
      
      toast({
        title: "Sale Created",
        description: "Invoice has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sale.",
        variant: "destructive",
      });
    },
  });

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
    <div className="p-6 space-y-8">
      {/* Section 1: Vehicle Fleet */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold" data-testid="text-section-vehicles">Vehicle Fleet</h2>
            <p className="text-sm text-muted-foreground">Select a vehicle to sell or add new vehicle</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Card 
                className="hover-elevate cursor-pointer border-dashed border-2 flex items-center justify-center min-h-[180px]"
                data-testid="button-add-vehicle"
              >
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium">Add Vehicle</p>
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
                          <FormLabel>Vehicle Number *</FormLabel>
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
                          <FormLabel>Vehicle Type *</FormLabel>
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
                            <Input placeholder="Auto-calculated" {...field} data-testid="input-capacity" />
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
                          <FormLabel>Vendor (Source)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vendor">
                                <SelectValue placeholder="Select vendor" />
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
                    <div className="flex items-center justify-between gap-2 flex-wrap">
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
            const isSelected = selectedVehicleId === vehicle.id;

            return (
              <Card
                key={vehicle.id}
                className={`hover-elevate cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
                onClick={() => handleVehicleSelect(vehicle.id)}
                data-testid={`card-vehicle-${vehicle.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={hasInventory ? "default" : "secondary"}>
                      {hasInventory ? `${itemsWithStock.length} items` : "Empty"}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{vehicle.number}</CardTitle>
                  <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasInventory ? (
                    <div className="space-y-1">
                      {itemsWithStock.slice(0, 3).map((inv) => (
                        <div key={inv.productId} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate">{getProductName(inv.productId)}</span>
                          <span className="font-medium">{inv.quantity} {getProductUnit(inv.productId)}</span>
                        </div>
                      ))}
                      {itemsWithStock.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{itemsWithStock.length - 3} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No products loaded</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Section 2: Customer Sale */}
      {selectedVehicleId && selectedVehicle && (
        <Card className="border-primary/50" data-testid="section-customer-sale">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Customer Sale</CardTitle>
                  <p className="text-sm text-muted-foreground">Selling from: {selectedVehicle.number}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedVehicleId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle Info */}
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium" data-testid="text-sale-vehicle-number">{selectedVehicle.number}</span>
                <Badge variant="outline">{selectedVehicle.type}</Badge>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </label>
                <Select value={selectedCustomerId || "new"} onValueChange={handleCustomerChange}>
                  <SelectTrigger data-testid="select-customer">
                    <SelectValue placeholder="Select or enter new customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Enter New Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(!selectedCustomerId || selectedCustomerId === "") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Customer Name</label>
                  <Input
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    data-testid="input-customer-name"
                  />
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Select Products
                </label>
                {saleProducts.length > 0 && (
                  <Badge variant="secondary">{saleProducts.length} selected</Badge>
                )}
              </div>
              
              <ScrollArea className="h-48 border rounded-md p-3">
                <div className="space-y-2">
                  {selectedVehicleInventory.filter(inv => inv.quantity > 0).map((inv) => {
                    const product = products.find(p => p.id === inv.productId);
                    if (!product) return null;
                    
                    const isSelected = saleProducts.some(p => p.productId === inv.productId);
                    const saleProduct = saleProducts.find(p => p.productId === inv.productId);

                    return (
                      <div 
                        key={inv.productId}
                        className={`p-3 border rounded-md transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSaleProduct(inv.productId)}
                            data-testid={`checkbox-sale-product-${inv.productId}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                <Badge variant="outline" className="text-xs">{product.unit}</Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">Available: {inv.quantity}</span>
                            </div>

                            {isSelected && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1">
                                    <Weight className="h-3 w-3" />
                                    Weight ({product.unit})
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      onClick={() => updateSaleProductWeight(inv.productId, (saleProduct?.weight || 0) - 1)}
                                      className="h-8 w-8"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={inv.quantity}
                                      step={product.unit === "KG" ? "0.1" : "1"}
                                      value={saleProduct?.weight || 0}
                                      onChange={(e) => updateSaleProductWeight(inv.productId, parseFloat(e.target.value) || 0)}
                                      className="text-center h-8 w-20"
                                      data-testid={`input-sale-weight-${inv.productId}`}
                                    />
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      onClick={() => updateSaleProductWeight(inv.productId, (saleProduct?.weight || 0) + 1)}
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
                                      onClick={() => updateSaleProductBags(inv.productId, (saleProduct?.bags || 0) - 1)}
                                      className="h-8 w-8"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={saleProduct?.bags || 0}
                                      onChange={(e) => updateSaleProductBags(inv.productId, parseInt(e.target.value) || 0)}
                                      className="text-center h-8 w-20"
                                      data-testid={`input-sale-bags-${inv.productId}`}
                                    />
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      onClick={() => updateSaleProductBags(inv.productId, (saleProduct?.bags || 0) + 1)}
                                      className="h-8 w-8"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {selectedVehicleInventory.filter(inv => inv.quantity > 0).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No products available in this vehicle</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Hamali Charges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-md">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Hamali Rate (per bag)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={hamaliRate}
                  onChange={(e) => setHamaliRate(parseFloat(e.target.value) || 0)}
                  data-testid="input-hamali-rate"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Bags</label>
                <div className="h-9 px-3 flex items-center bg-background border rounded-md">
                  <span className="font-medium" data-testid="text-sale-total-bags">{saleTotalBags}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Hamali Charge</label>
                <div className="h-9 px-3 flex items-center bg-background border rounded-md">
                  <span className="font-semibold text-primary" data-testid="text-total-hamali">
                    ₹{totalHamaliCharge.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                  <p className="text-lg font-semibold" data-testid="text-sale-total-weight">{saleTotalWeight.toFixed(1)} KG</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bags</p>
                  <p className="text-lg font-semibold">{saleTotalBags}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hamali</p>
                  <p className="text-lg font-semibold">₹{totalHamaliCharge.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-lg font-semibold">{saleProducts.length}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedVehicleId(null)} data-testid="button-cancel-sale">
                Cancel
              </Button>
              <Button 
                onClick={() => createSaleMutation.mutate()}
                disabled={createSaleMutation.isPending || saleProducts.length === 0 || (!selectedCustomerId && !customerName.trim())}
                data-testid="button-create-sale"
              >
                {createSaleMutation.isPending ? "Creating..." : "Create Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
