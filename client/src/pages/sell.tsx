import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Truck, Plus, Package, X, Check, Minus, Weight, ShoppingBag } from "lucide-react";
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
  price: number;
  available: number;
}

interface SaleDraft {
  products: SaleProduct[];
  customerName: string;
  selectedCustomerId: string;
  hamaliCharge: number;
}

interface VehicleSalePaneProps {
  vehicle: Vehicle;
  inventory: VehicleInventory[];
  products: Product[];
  customers: Customer[];
  draft: SaleDraft;
  onUpdateDraft: (draft: SaleDraft) => void;
  onClose: () => void;
  onSaleComplete: () => void;
}

function VehicleSalePane({ 
  vehicle, 
  inventory, 
  products, 
  customers, 
  draft, 
  onUpdateDraft, 
  onClose,
  onSaleComplete 
}: VehicleSalePaneProps) {
  const { toast } = useToast();

  const availableProducts = useMemo(() => {
    return inventory
      .filter(inv => inv.quantity > 0)
      .map(inv => {
        const product = products.find(p => p.id === inv.productId);
        const draftProduct = draft.products.find(p => p.productId === inv.productId);
        return {
          ...inv,
          product,
          weight: draftProduct?.weight || 0,
          price: draftProduct?.price || product?.salePrice || 0,
        };
      })
      .filter(item => item.product);
  }, [inventory, products, draft.products]);

  const updateProductField = (productId: string, field: 'weight' | 'bags' | 'price', value: number) => {
    const exists = draft.products.find(p => p.productId === productId);
    const product = products.find(p => p.id === productId);
    const inv = inventory.find(i => i.productId === productId);
    
    if (!product || !inv) return;

    if (exists) {
      onUpdateDraft({
        ...draft,
        products: draft.products.map(p =>
          p.productId === productId ? { ...p, [field]: Math.max(0, value) } : p
        ),
      });
    } else {
      onUpdateDraft({
        ...draft,
        products: [...draft.products, {
          productId,
          productName: product.name,
          unit: product.unit || "Units",
          weight: field === 'weight' ? value : 0,
          bags: field === 'bags' ? value : 0,
          price: field === 'price' ? value : (product.salePrice || 0),
          available: inv.quantity,
        }],
      });
    }
  };

  const handleCustomerChange = (value: string) => {
    if (value === "new") {
      onUpdateDraft({ ...draft, selectedCustomerId: "", customerName: "" });
    } else {
      const customer = customers.find(c => c.id === value);
      onUpdateDraft({ 
        ...draft, 
        selectedCustomerId: value, 
        customerName: customer?.name || "" 
      });
    }
  };

  const saleTotalWeight = useMemo(() => {
    return draft.products.reduce((sum, p) => sum + p.weight, 0);
  }, [draft.products]);

  const saleTotalBags = useMemo(() => {
    return draft.products.reduce((sum, p) => sum + (p.bags || 0), 0);
  }, [draft.products]);

  const saleSubtotal = useMemo(() => {
    return draft.products.reduce((sum, p) => sum + (p.weight * p.price), 0);
  }, [draft.products]);

  const createSaleMutation = useMutation({
    mutationKey: ['/api/invoices', 'create', vehicle.id],
    mutationFn: async () => {
      if (draft.products.length === 0) {
        throw new Error("Please select products to sell");
      }

      let customerId = draft.selectedCustomerId;
      if (!customerId && draft.customerName.trim()) {
        const customerRes = await apiRequest("POST", "/api/customers", {
          name: draft.customerName.trim(),
          phone: "",
          address: "",
          email: "",
        });
        const newCustomer = await customerRes.json();
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error("Please select or enter a customer name");
      }

      const subtotal = draft.products.reduce((sum, p) => sum + (p.weight * p.price), 0);

      const today = new Date().toISOString().split('T')[0];
      const invoiceNumber = `INV-${Date.now()}`;

      const items = draft.products
        .filter(p => p.weight > 0)
        .map(saleProduct => ({
          productId: saleProduct.productId,
          quantity: saleProduct.weight,
          unitPrice: saleProduct.price,
          total: saleProduct.weight * saleProduct.price,
        }));

      const invoiceRes = await apiRequest("POST", "/api/invoices", {
        invoiceNumber,
        customerId,
        vehicleId: vehicle.id,
        date: today,
        subtotal,
        includeHamaliCharge: draft.hamaliCharge > 0,
        hamaliRatePerKg: 0,
        hamaliChargeAmount: draft.hamaliCharge,
        hamaliPaidByCash: false,
        totalKgWeight: saleTotalWeight,
        grandTotal: subtotal + draft.hamaliCharge,
        items,
      });

      const invoice = await invoiceRes.json();

      for (const saleProduct of draft.products) {
        const currentInventory = inventory.find(i => i.productId === saleProduct.productId);
        if (currentInventory) {
          const newQuantity = Math.max(0, currentInventory.quantity - saleProduct.weight);
          await apiRequest("PATCH", `/api/vehicles/${vehicle.id}/inventory/${saleProduct.productId}`, {
            quantity: newQuantity,
          });

          await apiRequest("POST", "/api/vehicle-inventory-movements", {
            vehicleId: vehicle.id,
            productId: saleProduct.productId,
            type: "sale",
            quantity: saleProduct.weight,
            date: today,
            notes: `Sold to ${draft.customerName}`,
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
      
      toast({
        title: "Sale Created",
        description: `Invoice created for ${vehicle.number}.`,
      });

      onSaleComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sale.",
        variant: "destructive",
      });
    },
  });

  const hasProductsWithWeight = draft.products.some(p => p.weight > 0);
  const grandTotal = saleSubtotal + draft.hamaliCharge;

  return (
    <Card className="border-primary/30 w-80 flex-shrink-0" data-testid={`section-customer-sale-${vehicle.id}`}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Truck className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-semibold text-sm truncate" data-testid={`text-sale-vehicle-number-${vehicle.id}`}>{vehicle.number}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} data-testid={`button-close-sale-${vehicle.id}`}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <Select value={draft.selectedCustomerId || "new"} onValueChange={handleCustomerChange}>
          <SelectTrigger className="h-8 text-xs" data-testid={`select-customer-${vehicle.id}`}>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New Customer</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {(!draft.selectedCustomerId || draft.selectedCustomerId === "") && (
          <Input
            placeholder="Customer name"
            className="h-8 text-xs"
            value={draft.customerName}
            onChange={(e) => onUpdateDraft({ ...draft, customerName: e.target.value })}
            data-testid={`input-customer-name-${vehicle.id}`}
          />
        )}

        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-1 text-[10px] text-muted-foreground font-medium px-1">
            <div className="col-span-3">Product</div>
            <div className="col-span-2 text-center">Weight</div>
            <div className="col-span-2 text-center">Bags</div>
            <div className="col-span-3 text-center">Price/KG</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {availableProducts.map((item) => {
              const draftProduct = draft.products.find(p => p.productId === item.productId);
              const weight = draftProduct?.weight || 0;
              const bags = draftProduct?.bags || 0;
              const price = draftProduct?.price || item.product?.salePrice || 0;
              const lineTotal = weight * price;
              
              return (
                <div key={item.productId} className="grid grid-cols-12 gap-1 items-center">
                  <div className="col-span-3 text-xs truncate" title={item.product?.name}>
                    {item.product?.name}
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      className="h-6 text-xs text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={weight || ""}
                      placeholder="0"
                      onChange={(e) => updateProductField(item.productId, 'weight', parseFloat(e.target.value) || 0)}
                      data-testid={`input-weight-${vehicle.id}-${item.productId}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="h-6 text-xs text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={bags || ""}
                      placeholder="0"
                      onChange={(e) => updateProductField(item.productId, 'bags', parseInt(e.target.value) || 0)}
                      data-testid={`input-bags-${vehicle.id}-${item.productId}`}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      className="h-6 text-xs text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={price || ""}
                      placeholder="0"
                      onChange={(e) => updateProductField(item.productId, 'price', parseFloat(e.target.value) || 0)}
                      data-testid={`input-price-${vehicle.id}-${item.productId}`}
                    />
                  </div>
                  <div className="col-span-2 text-xs text-right font-medium">
                    {lineTotal > 0 ? `₹${lineTotal.toFixed(0)}` : "-"}
                  </div>
                </div>
              );
            })}
            {availableProducts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No products</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Hamali Charge:</span>
          <Input
            type="number"
            min="0"
            className="h-6 text-xs w-20 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={draft.hamaliCharge || ""}
            placeholder="0"
            onChange={(e) => onUpdateDraft({ ...draft, hamaliCharge: parseFloat(e.target.value) || 0 })}
            data-testid={`input-hamali-${vehicle.id}`}
          />
        </div>

        <div className="pt-2 border-t space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Weight:</span>
            <span data-testid={`text-total-weight-${vehicle.id}`}>{saleTotalWeight.toFixed(1)} KG</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Bags:</span>
            <span data-testid={`text-total-bags-${vehicle.id}`}>{saleTotalBags}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>₹{saleSubtotal.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Hamali:</span>
            <span>₹{draft.hamaliCharge.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-sm font-medium">Grand Total:</span>
            <span className="font-bold text-base text-primary" data-testid={`text-grand-total-${vehicle.id}`}>₹{grandTotal.toFixed(0)}</span>
          </div>
        </div>

        <Button 
          size="sm"
          className="w-full h-8"
          onClick={() => createSaleMutation.mutate()}
          disabled={createSaleMutation.isPending || !hasProductsWithWeight || (!draft.selectedCustomerId && !draft.customerName.trim())}
          data-testid={`button-create-sale-${vehicle.id}`}
        >
          {createSaleMutation.isPending ? "..." : "Create Sale"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Sell() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);
  
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [saleDrafts, setSaleDrafts] = useState<Record<string, SaleDraft>>({});

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

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    const isCurrentlySelected = selectedVehicleIds.has(vehicleId);
    
    if (isCurrentlySelected) {
      setSelectedVehicleIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(vehicleId);
        return newSet;
      });
      setSaleDrafts(prevDrafts => {
        const newDrafts = { ...prevDrafts };
        delete newDrafts[vehicleId];
        return newDrafts;
      });
    } else {
      setSelectedVehicleIds(prev => {
        const newSet = new Set(prev);
        newSet.add(vehicleId);
        return newSet;
      });
      setSaleDrafts(prevDrafts => ({
        ...prevDrafts,
        [vehicleId]: {
          products: [],
          customerName: "",
          selectedCustomerId: "",
          hamaliCharge: 0,
        },
      }));
    }
  }, [selectedVehicleIds]);

  const handleUpdateDraft = useCallback((vehicleId: string, draft: SaleDraft) => {
    setSaleDrafts(prev => ({
      ...prev,
      [vehicleId]: draft,
    }));
  }, []);

  const handleCloseSale = useCallback((vehicleId: string) => {
    setSelectedVehicleIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(vehicleId);
      return newSet;
    });
    setSaleDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[vehicleId];
      return newDrafts;
    });
  }, []);

  const handleSaleComplete = useCallback((vehicleId: string) => {
    handleCloseSale(vehicleId);
  }, [handleCloseSale]);

  if (vehiclesLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Sell</h1>
            <p className="text-muted-foreground">Select vehicles to start selling</p>
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

  const selectedVehiclesArray = vehicles.filter(v => selectedVehicleIds.has(v.id));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold" data-testid="text-section-vehicles">Sell</h1>
          {selectedVehicleIds.size > 0 && (
            <Badge variant="secondary" className="text-xs">{selectedVehicleIds.size} selected</Badge>
          )}
        </div>
        {selectedVehicleIds.size > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedVehicleIds(new Set());
              setSaleDrafts({});
            }}
            data-testid="button-clear-all-sales"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Card 
              className="hover-elevate cursor-pointer border-dashed border-2 flex items-center justify-center w-28 h-24 flex-shrink-0"
              data-testid="button-add-vehicle"
            >
              <CardContent className="flex flex-col items-center justify-center p-2 text-center">
                <Plus className="h-5 w-5 text-primary mb-1" />
                <span className="text-xs font-medium">Add</span>
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
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{product.name}</span>
                                      <Badge variant="outline" className="text-xs">{product.unit}</Badge>
                                    </div>
                                    <span className="text-sm text-muted-foreground">Stock: {product.currentStock}</span>
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
                                            max={product.currentStock}
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
                                          Bags
                                          {(productData?.bags || 0) > 0 && (
                                            <Badge variant="secondary" className="text-xs ml-1">{productData?.bags}</Badge>
                                          )}
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
          const isSelected = selectedVehicleIds.has(vehicle.id);

          if (isSelected) {
            return (
              <VehicleSalePane
                key={vehicle.id}
                vehicle={vehicle}
                inventory={vehicleInventories[vehicle.id] || []}
                products={products}
                customers={customers}
                draft={saleDrafts[vehicle.id] || { products: [], customerName: "", selectedCustomerId: "", hamaliCharge: 0 }}
                onUpdateDraft={(draft) => handleUpdateDraft(vehicle.id, draft)}
                onClose={() => handleCloseSale(vehicle.id)}
                onSaleComplete={() => handleSaleComplete(vehicle.id)}
              />
            );
          }

          return (
            <Card
              key={vehicle.id}
              className="hover-elevate cursor-pointer w-28 h-24 flex-shrink-0"
              onClick={() => handleVehicleSelect(vehicle.id)}
              data-testid={`card-vehicle-${vehicle.id}`}
            >
              <CardContent className="p-2 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Truck className="h-4 w-4 text-primary" />
                  <Badge variant={hasInventory ? "secondary" : "outline"} className="text-[10px] px-1 py-0">
                    {hasInventory ? itemsWithStock.length : 0}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-semibold truncate" title={vehicle.number}>{vehicle.number}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{vehicle.type}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
