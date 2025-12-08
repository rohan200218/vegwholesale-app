import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Scale, Plus, Trash2, Truck, User, FileText, Wifi, WifiOff, RefreshCw } from "lucide-react";
import type { Vehicle, Customer, Product, VehicleInventory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package } from "lucide-react";

type WeighingItem = {
  id: string;
  productId: string;
  productName: string;
  weight: number;
  unit: string;
  unitPrice: number;
  total: number;
};

export default function Weighing() {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [weighingItems, setWeighingItems] = useState<WeighingItem[]>([]);
  const [includeHalalCharge, setIncludeHalalCharge] = useState(false);
  const [halalChargePercent, setHalalChargePercent] = useState("5");
  
  // Scale connection state
  const [scaleConnected, setScaleConnected] = useState(false);
  const [liveWeight, setLiveWeight] = useState<number>(0);
  const [weightStable, setWeightStable] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Vehicle inventory query
  const { data: vehicleInventoryData = [], isLoading: inventoryLoading } = useQuery<VehicleInventory[]>({
    queryKey: ["/api/vehicles", selectedVehicle, "inventory"],
    queryFn: async () => {
      if (!selectedVehicle) return [];
      const res = await fetch(`/api/vehicles/${selectedVehicle}/inventory`);
      return res.json();
    },
    enabled: !!selectedVehicle,
  });

  // Calculate remaining inventory (account for items added to current bill)
  const getVehicleStock = (productId: string): number => {
    const inventoryItem = vehicleInventoryData.find(inv => inv.productId === productId);
    const baseQty = inventoryItem?.quantity || 0;
    const usedQty = weighingItems
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.weight, 0);
    return Math.max(0, baseQty - usedQty);
  };

  // Demo mode: simulate weight changes
  useEffect(() => {
    if (demoMode && scaleConnected) {
      demoIntervalRef.current = setInterval(() => {
        // Simulate fluctuating weight that stabilizes
        const baseWeight = Math.random() * 50 + 10;
        const fluctuation = Math.random() * 0.5 - 0.25;
        setLiveWeight(parseFloat((baseWeight + fluctuation).toFixed(2)));
        setWeightStable(Math.random() > 0.3);
      }, 500);
    } else {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    }
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [demoMode, scaleConnected]);

  const toggleScaleConnection = () => {
    if (scaleConnected) {
      setScaleConnected(false);
      setLiveWeight(0);
      setWeightStable(false);
    } else {
      setScaleConnected(true);
      toast({
        title: demoMode ? "Demo Mode Active" : "Connecting to Scale",
        description: demoMode 
          ? "Simulating weight readings. Connect real scale when ready." 
          : "Attempting to connect to weighing machine...",
      });
    }
  };

  const captureWeight = () => {
    if (weightStable && liveWeight > 0) {
      setWeight(liveWeight.toFixed(2));
      toast({
        title: "Weight Captured",
        description: `Captured ${liveWeight.toFixed(2)} KG from scale`,
      });
    } else {
      toast({
        title: "Weight Not Stable",
        description: "Please wait for the weight to stabilize before capturing.",
        variant: "destructive",
      });
    }
  };

  const createInvoice = useMutation({
    mutationFn: async (data: {
      customerId: string;
      vehicleId?: string;
      invoiceNumber: string;
      date: string;
      subtotal: number;
      includeHalalCharge: boolean;
      halalChargePercent: number;
      halalChargeAmount: number;
      grandTotal: number;
      items: { productId: string; quantity: number; unitPrice: number; total: number }[];
    }) => {
      return apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", selectedVehicle, "inventory"] });
      setWeighingItems([]);
      setSelectedCustomer("");
      setSelectedVehicle("");
      toast({ title: "Invoice Created", description: "Weighing completed and invoice generated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create invoice.", variant: "destructive" });
    },
  });

  const getProduct = (id: string) => products.find((p) => p.id === id);

  const addWeighingItem = () => {
    if (!selectedProduct || !weight || parseFloat(weight) <= 0) {
      toast({ title: "Invalid Entry", description: "Please select a product and capture/enter a valid weight.", variant: "destructive" });
      return;
    }

    const product = getProduct(selectedProduct);
    if (!product) return;

    const weightNum = parseFloat(weight);
    
    // Check vehicle inventory if a vehicle is selected
    if (selectedVehicle && vehicleInventoryData.length > 0) {
      const remainingStock = getVehicleStock(selectedProduct);
      if (weightNum > remainingStock) {
        toast({ 
          title: "Insufficient Stock", 
          description: `Only ${remainingStock.toFixed(2)} ${product.unit} available in the selected vehicle.`, 
          variant: "destructive" 
        });
        return;
      }
    }
    
    const total = weightNum * product.salePrice;

    const newItem: WeighingItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      weight: weightNum,
      unit: product.unit,
      unitPrice: product.salePrice,
      total,
    };

    setWeighingItems([...weighingItems, newItem]);
    setSelectedProduct("");
    setWeight("");
  };

  const removeWeighingItem = (id: string) => {
    setWeighingItems(weighingItems.filter((item) => item.id !== id));
  };

  const subtotal = weighingItems.reduce((sum, item) => sum + item.total, 0);
  const halalAmount = includeHalalCharge ? (subtotal * parseFloat(halalChargePercent || "0")) / 100 : 0;
  const grandTotal = subtotal + halalAmount;

  const handleGenerateInvoice = () => {
    if (!selectedCustomer) {
      toast({ title: "Select Customer", description: "Please select a customer for this invoice.", variant: "destructive" });
      return;
    }

    if (weighingItems.length === 0) {
      toast({ title: "No Items", description: "Please add at least one item to the invoice.", variant: "destructive" });
      return;
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    const today = new Date().toISOString().split("T")[0];

    createInvoice.mutate({
      customerId: selectedCustomer,
      vehicleId: selectedVehicle || undefined,
      invoiceNumber,
      date: today,
      subtotal,
      includeHalalCharge,
      halalChargePercent: parseFloat(halalChargePercent || "0"),
      halalChargeAmount: halalAmount,
      grandTotal,
      items: weighingItems.map((item) => ({
        productId: item.productId,
        quantity: item.weight,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    });
  };

  if (vehiclesLoading || customersLoading || productsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Scale className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              Weighing Station
            </h1>
            <p className="text-sm text-muted-foreground">Take products from vehicle, weigh, and bill customer</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="demo-mode" className="text-sm text-muted-foreground">Demo Mode</Label>
            <Switch
              id="demo-mode"
              checked={demoMode}
              onCheckedChange={setDemoMode}
              data-testid="switch-demo-mode"
            />
          </div>
          <Badge variant={scaleConnected ? "default" : "secondary"} className="gap-1">
            {scaleConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {scaleConnected ? "Scale Connected" : "Scale Disconnected"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Live Scale Display */}
          <Card className={scaleConnected ? "border-primary" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Live Scale Reading
                </div>
                <Button
                  variant={scaleConnected ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleScaleConnection}
                  data-testid="button-toggle-scale"
                >
                  {scaleConnected ? "Disconnect" : "Connect Scale"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className={`text-5xl font-mono font-bold text-center py-6 rounded-md ${
                    scaleConnected 
                      ? weightStable 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      : "bg-muted text-muted-foreground"
                  }`} data-testid="display-live-weight">
                    {scaleConnected ? `${liveWeight.toFixed(2)} KG` : "-- KG"}
                  </div>
                  <div className="text-center mt-2 text-sm">
                    {scaleConnected ? (
                      weightStable ? (
                        <span className="text-green-600 dark:text-green-400">Weight Stable</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Stabilizing...
                        </span>
                      )
                    ) : (
                      <span className="text-muted-foreground">Scale not connected</span>
                    )}
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={captureWeight}
                  disabled={!scaleConnected || !weightStable || liveWeight <= 0}
                  className="min-w-[150px]"
                  data-testid="button-capture-weight"
                >
                  <Scale className="h-4 w-4 mr-2" />
                  Capture Weight
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Step 1: Select Vehicle & Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle (Parked Near Shop)</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger data-testid="select-vehicle">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.number} - {vehicle.driverName || vehicle.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle Inventory Display */}
              {selectedVehicle && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">Products Available in Vehicle</span>
                    </div>
                    {inventoryLoading && <Badge variant="outline">Loading...</Badge>}
                  </div>
                  {vehicleInventoryData.length === 0 && !inventoryLoading ? (
                    <div className="text-center py-4 bg-muted/50 rounded-md">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No products loaded in this vehicle</p>
                      <p className="text-xs text-muted-foreground mt-1">Create a purchase order with this vehicle to load products</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Available Qty</TableHead>
                            <TableHead className="text-right">Unit</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vehicleInventoryData.map((inv) => {
                            const product = products.find(p => p.id === inv.productId);
                            const remaining = getVehicleStock(inv.productId);
                            return (
                              <TableRow 
                                key={inv.id}
                                data-testid={`vehicle-stock-${inv.productId}`}
                              >
                                <TableCell className="font-medium">{product?.name || "Unknown Product"}</TableCell>
                                <TableCell className="text-right font-mono text-lg font-semibold">
                                  {remaining.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {product?.unit || "KG"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {remaining > (product?.reorderLevel || 10) ? (
                                    <Badge variant="default" className="bg-green-600">In Stock</Badge>
                                  ) : remaining > 0 ? (
                                    <Badge variant="secondary" className="bg-yellow-500 text-yellow-950">Low Stock</Badge>
                                  ) : (
                                    <Badge variant="destructive">Out of Stock</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Step 2: Weigh Products & Add to Bill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label>Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger data-testid="select-product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.salePrice.toLocaleString("en-IN", { style: "currency", currency: "INR" })}/{product.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weight ({getProduct(selectedProduct)?.unit || "KG"})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={scaleConnected ? "From scale" : "Enter weight"}
                    data-testid="input-weight"
                  />
                </div>
                <Button onClick={addWeighingItem} data-testid="button-add-item">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weighingItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No items weighed yet. {scaleConnected ? "Capture weight from the scale and add items." : "Connect scale or enter weight manually."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      weighingItems.map((item) => (
                        <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {item.weight} {item.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.unitPrice.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {item.total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeWeighingItem(item.id)}
                              data-testid={`button-remove-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {customers.find((c) => c.id === selectedCustomer)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customers.find((c) => c.id === selectedCustomer)?.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customers.find((c) => c.id === selectedCustomer)?.address}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Select a customer</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between gap-2 text-sm">
                  <span>Items</span>
                  <Badge variant="secondary">{weighingItems.length}</Badge>
                </div>
                <div className="flex justify-between gap-2 text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono" data-testid="text-subtotal">
                    {subtotal.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="halalCharge"
                    checked={includeHalalCharge}
                    onChange={(e) => setIncludeHalalCharge(e.target.checked)}
                    className="rounded"
                    data-testid="checkbox-halal"
                  />
                  <Label htmlFor="halalCharge" className="text-sm">Include Halal Charge</Label>
                </div>
                {includeHalalCharge && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={halalChargePercent}
                      onChange={(e) => setHalalChargePercent(e.target.value)}
                      className="w-20"
                      data-testid="input-halal-percent"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <span className="ml-auto font-mono text-sm" data-testid="text-halal-amount">
                      {halalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between gap-2 text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="font-mono" data-testid="text-grand-total">
                    {grandTotal.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGenerateInvoice}
                disabled={weighingItems.length === 0 || !selectedCustomer || createInvoice.isPending}
                className="w-full"
                data-testid="button-generate-invoice"
              >
                {createInvoice.isPending ? "Generating..." : "Generate Invoice"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
