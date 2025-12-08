import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Scale, Plus, Trash2, Truck, User, FileText } from "lucide-react";
import type { Vehicle, Customer, Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createInvoice = useMutation({
    mutationFn: async (data: {
      customerId: string;
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
      toast({ title: "Invalid Entry", description: "Please select a product and enter a valid weight.", variant: "destructive" });
      return;
    }

    const product = getProduct(selectedProduct);
    if (!product) return;

    const weightNum = parseFloat(weight);
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
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Weighing Station
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Select Vehicle & Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle (Truck)</Label>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Add Weighed Items
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
                    placeholder="Enter weight"
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
                          No items weighed yet. Add products from the scale.
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
                <div className="flex justify-between text-sm">
                  <span>Items</span>
                  <Badge variant="secondary">{weighingItems.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
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
                <div className="flex justify-between text-lg font-bold">
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
