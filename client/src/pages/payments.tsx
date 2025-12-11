import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, CreditCard, Wallet, Trash2 } from "lucide-react";
import type { Vendor, Customer, VendorPayment, CustomerPayment, HamaliCashPayment } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type VendorWithBalance = Vendor & { totalPurchases: number; totalPayments: number; balance: number };
type CustomerWithBalance = Customer & { totalInvoices: number; totalPayments: number; balance: number };

export default function Payments() {
  const { toast } = useToast();
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [vendorPaymentAmount, setVendorPaymentAmount] = useState("");
  const [customerPaymentAmount, setCustomerPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [hamaliDialogOpen, setHamaliDialogOpen] = useState(false);
  const [hamaliAmount, setHamaliAmount] = useState("");
  const [hamaliCustomerId, setHamaliCustomerId] = useState<string>("none");
  const [hamaliNotes, setHamaliNotes] = useState("");

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: vendorBalances = [], isLoading: vendorBalancesLoading } = useQuery<VendorWithBalance[]>({
    queryKey: ["/api/reports/vendor-balances"],
  });

  const { data: customerBalances = [], isLoading: customerBalancesLoading } = useQuery<CustomerWithBalance[]>({
    queryKey: ["/api/reports/customer-balances"],
  });

  const { data: vendorPayments = [] } = useQuery<VendorPayment[]>({
    queryKey: ["/api/vendor-payments"],
  });

  const { data: customerPayments = [] } = useQuery<CustomerPayment[]>({
    queryKey: ["/api/customer-payments"],
  });

  const { data: hamaliCashPayments = [] } = useQuery<HamaliCashPayment[]>({
    queryKey: ["/api/hamali-cash"],
  });

  const createVendorPayment = useMutation({
    mutationFn: async (data: { vendorId: string; amount: number; paymentMethod: string; date: string }) => {
      return apiRequest("POST", "/api/vendor-payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/vendor-balances"] });
      setVendorDialogOpen(false);
      setSelectedVendor("");
      setVendorPaymentAmount("");
      toast({ title: "Payment recorded", description: "Vendor payment has been recorded successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
    },
  });

  const createCustomerPayment = useMutation({
    mutationFn: async (data: { customerId: string; amount: number; paymentMethod: string; date: string }) => {
      return apiRequest("POST", "/api/customer-payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/customer-balances"] });
      setCustomerDialogOpen(false);
      setSelectedCustomer("");
      setCustomerPaymentAmount("");
      toast({ title: "Payment recorded", description: "Customer payment has been recorded successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
    },
  });

  const createHamaliCashPayment = useMutation({
    mutationFn: async (data: { amount: number; date: string; paymentMethod: string; customerId?: string; notes?: string }) => {
      return apiRequest("POST", "/api/hamali-cash", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hamali-cash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
      setHamaliDialogOpen(false);
      setHamaliAmount("");
      setHamaliCustomerId("none");
      setHamaliNotes("");
      toast({ title: "Hamali payment recorded", description: "Direct Hamali cash payment has been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record Hamali payment.", variant: "destructive" });
    },
  });

  const deleteHamaliCashPayment = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/hamali-cash/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hamali-cash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/profit-loss"] });
      toast({ title: "Payment deleted", description: "Hamali cash payment has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete payment.", variant: "destructive" });
    },
  });

  const handleVendorPayment = () => {
    if (!selectedVendor || !vendorPaymentAmount) return;
    createVendorPayment.mutate({
      vendorId: selectedVendor,
      amount: parseFloat(vendorPaymentAmount),
      paymentMethod,
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleCustomerPayment = () => {
    if (!selectedCustomer || !customerPaymentAmount) return;
    createCustomerPayment.mutate({
      customerId: selectedCustomer,
      amount: parseFloat(customerPaymentAmount),
      paymentMethod,
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleHamaliPayment = () => {
    if (!hamaliAmount) return;
    createHamaliCashPayment.mutate({
      amount: parseFloat(hamaliAmount),
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      customerId: hamaliCustomerId === "none" ? undefined : hamaliCustomerId,
      notes: hamaliNotes || undefined,
    });
  };

  const getVendorName = (id: string) => vendors.find((v) => v.id === id)?.name || "Unknown";
  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || "Unknown";

  const totalVendorOutstanding = vendorBalances.reduce((sum, v) => sum + v.balance, 0);
  const totalCustomerReceivable = customerBalances.reduce((sum, c) => sum + c.balance, 0);

  if (vendorsLoading || customersLoading || vendorBalancesLoading || customerBalancesLoading) {
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
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Payments
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendor Outstanding
            </CardTitle>
            <Wallet className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-vendor-outstanding">
              {totalVendorOutstanding.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
            </div>
            <p className="text-xs text-muted-foreground">Amount to pay vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Receivable
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-customer-receivable">
              {totalCustomerReceivable.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
            </div>
            <p className="text-xs text-muted-foreground">Amount to receive from customers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendors" data-testid="tab-vendors">Vendor Payments</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Customer Payments</TabsTrigger>
          <TabsTrigger value="hamali" data-testid="tab-hamali">Hamali Cash</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-vendor-payment">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Vendor Payment</DialogTitle>
                  <DialogDescription>Record a payment made to a vendor</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                      <SelectTrigger data-testid="select-vendor">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={vendorPaymentAmount}
                      onChange={(e) => setVendorPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      data-testid="input-vendor-payment-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleVendorPayment}
                    disabled={!selectedVendor || !vendorPaymentAmount || createVendorPayment.isPending}
                    className="w-full"
                    data-testid="button-submit-vendor-payment"
                  >
                    {createVendorPayment.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Total Purchases</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No vendor data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendorBalances.map((vendor) => (
                      <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {vendor.totalPurchases.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {vendor.totalPayments.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {vendor.balance.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No payment history
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendorPayments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{getVendorName(payment.vendorId)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right font-mono">
                          {payment.amount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-customer-payment">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Customer Payment</DialogTitle>
                  <DialogDescription>Record a payment received from a customer</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
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
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={customerPaymentAmount}
                      onChange={(e) => setCustomerPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      data-testid="input-customer-payment-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger data-testid="select-customer-payment-method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleCustomerPayment}
                    disabled={!selectedCustomer || !customerPaymentAmount || createCustomerPayment.isPending}
                    className="w-full"
                    data-testid="button-submit-customer-payment"
                  >
                    {createCustomerPayment.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total Invoices</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerBalances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No customer data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerBalances.map((customer) => (
                      <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {customer.totalInvoices.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {customer.totalPayments.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {customer.balance.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No payment history
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerPayments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-customer-payment-${payment.id}`}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{getCustomerName(payment.customerId)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right font-mono">
                          {payment.amount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hamali" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={hamaliDialogOpen} onOpenChange={setHamaliDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-hamali-payment">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Hamali Cash
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Hamali Cash Payment</DialogTitle>
                  <DialogDescription>Record direct cash given for Hamali (not through invoice)</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={hamaliAmount}
                      onChange={(e) => setHamaliAmount(e.target.value)}
                      placeholder="Enter amount"
                      data-testid="input-hamali-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer (Optional)</Label>
                    <Select value={hamaliCustomerId} onValueChange={setHamaliCustomerId}>
                      <SelectTrigger data-testid="select-hamali-customer">
                        <SelectValue placeholder="Select customer (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No customer</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={hamaliNotes}
                      onChange={(e) => setHamaliNotes(e.target.value)}
                      placeholder="Add notes"
                      data-testid="input-hamali-notes"
                    />
                  </div>
                  <Button
                    onClick={handleHamaliPayment}
                    disabled={!hamaliAmount || createHamaliCashPayment.isPending}
                    className="w-full"
                    data-testid="button-submit-hamali-payment"
                  >
                    {createHamaliCashPayment.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Direct Hamali Cash Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hamaliCashPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No direct Hamali cash payments recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    hamaliCashPayments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-hamali-payment-${payment.id}`}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.customerId ? getCustomerName(payment.customerId) : "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{payment.notes || "-"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {payment.amount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteHamaliCashPayment.mutate(payment.id)}
                            disabled={deleteHamaliCashPayment.isPending}
                            data-testid={`button-delete-hamali-${payment.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {hamaliCashPayments.length > 0 && (
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-muted-foreground">Total Direct Hamali Cash:</span>
                  <span className="text-xl font-bold font-mono" data-testid="text-hamali-cash-total">
                    {hamaliCashPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
