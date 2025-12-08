import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Search,
  Receipt,
  X,
  Printer,
  Leaf,
} from "lucide-react";
import type { Customer, Product, Invoice } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface InvoiceLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  date: z.string().min(1, "Please select a date"),
  includeHalalCharge: z.boolean().default(false),
  halalChargePercent: z.coerce.number().min(0).max(100).default(2),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export default function Billing() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: "",
      date: new Date().toISOString().split("T")[0],
      includeHalalCharge: false,
      halalChargePercent: 2,
    },
  });

  const includeHalalCharge = form.watch("includeHalalCharge");
  const halalChargePercent = form.watch("halalChargePercent");

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData & { items: InvoiceLineItem[] }) => {
      const subtotal = data.items.reduce((acc, item) => acc + item.total, 0);
      const halalChargeAmount = data.includeHalalCharge
        ? (subtotal * data.halalChargePercent) / 100
        : 0;
      const grandTotal = subtotal + halalChargeAmount;

      return apiRequest("POST", "/api/invoices", {
        customerId: data.customerId,
        date: data.date,
        subtotal,
        includeHalalCharge: data.includeHalalCharge,
        halalChargePercent: data.halalChargePercent,
        halalChargeAmount,
        grandTotal,
        invoiceNumber: `INV-${Date.now()}`,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      setIsDialogOpen(false);
      setLineItems([]);
      form.reset();
      toast({ title: "Invoice created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    },
  });

  const addLineItem = () => {
    if (!selectedProduct || !itemQuantity) {
      toast({ title: "Please fill all item fields", variant: "destructive" });
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const quantity = parseFloat(itemQuantity);

    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Please enter a valid quantity", variant: "destructive" });
      return;
    }

    if (quantity > product.currentStock) {
      toast({
        title: `Insufficient stock. Available: ${product.currentStock} ${product.unit}`,
        variant: "destructive",
      });
      return;
    }

    setLineItems([
      ...lineItems,
      {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.salePrice,
        total: quantity * product.salePrice,
      },
    ]);

    setSelectedProduct("");
    setItemQuantity("");
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
  const halalChargeAmount = includeHalalCharge
    ? (subtotal * halalChargePercent) / 100
    : 0;
  const grandTotal = subtotal + halalChargeAmount;

  const onSubmit = (data: InvoiceFormData) => {
    if (lineItems.length === 0) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }

    createMutation.mutate({ ...data, items: lineItems });
  };

  const openCreateDialog = () => {
    form.reset({
      customerId: "",
      date: new Date().toISOString().split("T")[0],
      includeHalalCharge: false,
      halalChargePercent: 2,
    });
    setLineItems([]);
    setIsDialogOpen(true);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const customer = customers.find((c) => c.id === invoice.customerId);
    return (
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const isLoading = customersLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage customer invoices
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-new-invoice">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-invoices"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No invoices found</p>
              <p className="text-sm">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first invoice"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={openCreateDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Halal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const customer = customers.find((c) => c.id === invoice.customerId);
                  return (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer?.name || "Unknown"}
                      </TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{invoice.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.includeHalalCharge ? (
                          <div className="flex items-center justify-end gap-1">
                            <Leaf className="h-3 w-3 text-primary" />
                            <span className="font-mono text-sm">
                              ₹{(invoice.halalChargeAmount || 0).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ₹{invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={invoice.status === "paid" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-invoice-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Product</label>
                      <Select value={selectedProduct} onValueChange={(val) => {
                        setSelectedProduct(val);
                        const product = products.find(p => p.id === val);
                        if (product) {
                          setItemQuantity("");
                        }
                      }}>
                        <SelectTrigger data-testid="select-item-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem 
                              key={product.id} 
                              value={product.id}
                              disabled={product.currentStock <= 0}
                            >
                              {product.name} - ₹{product.salePrice.toFixed(2)} ({product.currentStock} {product.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Quantity</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        data-testid="input-item-quantity"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={addLineItem}
                        className="w-full"
                        data-testid="button-add-item"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {lineItems.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right font-mono">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{item.unitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{item.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLineItem(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Halal Charge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="halal-toggle">Include Halal Charge</Label>
                      <p className="text-sm text-muted-foreground">
                        Add a percentage-based Halal certification fee
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="includeHalalCharge"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              id="halal-toggle"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-halal-charge"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {includeHalalCharge && (
                    <FormField
                      control={form.control}
                      name="halalChargePercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Halal Charge Percentage (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              {...field}
                              data-testid="input-halal-percent"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono" data-testid="text-subtotal">
                      ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {includeHalalCharge && (
                    <div className="flex items-center justify-between text-primary">
                      <span className="flex items-center gap-2">
                        <Leaf className="h-4 w-4" />
                        Halal Charge ({halalChargePercent}%)
                      </span>
                      <span className="font-mono" data-testid="text-halal-amount">
                        ₹{halalChargeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Grand Total</span>
                    <span className="text-2xl font-semibold font-mono" data-testid="text-grand-total">
                      ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || lineItems.length === 0}
                  data-testid="button-submit-invoice"
                >
                  {createMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
