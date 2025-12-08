import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Package, ArrowUpRight, ArrowDownRight, RotateCcw, CircleCheck, CircleX, Receipt, CreditCard, Users } from "lucide-react";
import type { Product, StockMovement } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type HalalSummary = {
  totalHalalCollected: number;
  invoicesWithHalal: number;
  invoicesWithoutHalal: number;
  salesWithHalal: number;
  salesWithoutHalal: number;
};

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerId: string;
  subtotal: number;
  includeHalalCharge: boolean;
  halalChargePercent: number;
  halalChargeAmount: number;
  grandTotal: number;
};

type CustomerPaymentSummary = {
  customerId: string;
  customerName: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  halalAmount: number;
  paymentStatus: "paid" | "partial" | "unpaid";
};

type ProfitLossReport = {
  totalPurchases: number;
  totalReturns: number;
  netPurchases: number;
  totalSales: number;
  grossProfit: number;
  productProfits: {
    id: string;
    name: string;
    purchasePrice: number;
    salePrice: number;
    margin: number;
    marginPercent: number;
  }[];
  halalSummary?: HalalSummary;
  invoiceDetails?: InvoiceDetail[];
  customerPaymentSummary?: CustomerPaymentSummary[];
};

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const { data: profitLoss, isLoading: profitLoading } = useQuery<ProfitLossReport>({
    queryKey: ["/api/reports/profit-loss"],
  });

  const getProductName = (id: string) => products.find((p) => p.id === id)?.name || "Unknown";

  const filteredMovements = stockMovements.filter((m) => {
    if (startDate && m.date < startDate) return false;
    if (endDate && m.date > endDate) return false;
    return true;
  });

  const stockInTotal = filteredMovements.filter((m) => m.type === "in").reduce((sum, m) => sum + m.quantity, 0);
  const stockOutTotal = filteredMovements.filter((m) => m.type === "out").reduce((sum, m) => sum + m.quantity, 0);

  const lowStockProducts = products.filter((p) => p.currentStock <= (p.reorderLevel || 10));

  if (productsLoading || movementsLoading || profitLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
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
          Reports
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Purchases
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-purchases">
              {(profitLoss?.totalPurchases || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
            </div>
            <p className="text-xs text-muted-foreground">Cost of goods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendor Returns
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400" data-testid="text-total-returns">
              {(profitLoss?.totalReturns || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
            </div>
            <p className="text-xs text-muted-foreground">Returned to vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-total-sales">
              {(profitLoss?.totalSales || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
            </div>
            <p className="text-xs text-muted-foreground">Revenue generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross Profit
            </CardTitle>
            {(profitLoss?.grossProfit || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${(profitLoss?.grossProfit || 0) >= 0 ? "text-primary" : "text-destructive"}`} data-testid="text-gross-profit">
              {(profitLoss?.grossProfit || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
            </div>
            <p className="text-xs text-muted-foreground">Sales - Net Purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-low-stock-count">
              {lowStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">Items below reorder level</p>
          </CardContent>
        </Card>
      </div>

      {/* Halal Charge Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Halal Charge Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Total Halal Collected</p>
              <p className="text-2xl font-bold font-mono text-primary" data-testid="text-halal-collected">
                {(profitLoss?.halalSummary?.totalHalalCollected || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Amount from all invoices with Halal charge</p>
            </div>
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-primary" />
                Halal Included
              </p>
              <p className="text-xl font-bold font-mono" data-testid="text-halal-included-count">
                {profitLoss?.halalSummary?.invoicesWithHalal || 0} invoices
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sales total:</p>
              <p className="text-sm font-mono">
                {(profitLoss?.halalSummary?.salesWithHalal || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
              </p>
            </div>
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CircleX className="h-4 w-4 text-muted-foreground" />
                Halal Excluded
              </p>
              <p className="text-xl font-bold font-mono" data-testid="text-halal-excluded-count">
                {profitLoss?.halalSummary?.invoicesWithoutHalal || 0} invoices
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sales total:</p>
              <p className="text-sm font-mono">
                {(profitLoss?.halalSummary?.salesWithoutHalal || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="halal" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="halal" data-testid="tab-halal">
            <Receipt className="h-4 w-4 mr-1" />
            Invoice Details
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <CreditCard className="h-4 w-4 mr-1" />
            Payment Status
          </TabsTrigger>
          <TabsTrigger value="profit" data-testid="tab-profit">Profit Margins</TabsTrigger>
          <TabsTrigger value="stock" data-testid="tab-stock">Stock Movements</TabsTrigger>
          <TabsTrigger value="lowstock" data-testid="tab-lowstock">Low Stock Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="halal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Halal Charge Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-center">Halal Status</TableHead>
                    <TableHead className="text-right">Halal %</TableHead>
                    <TableHead className="text-right">Halal Amount</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!profitLoss?.invoiceDetails || profitLoss.invoiceDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    profitLoss.invoiceDetails.map((invoice) => (
                      <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell className="font-medium font-mono">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell className="text-right font-mono">
                          {invoice.subtotal.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-center">
                          {invoice.includeHalalCharge ? (
                            <Badge variant="default" className="gap-1">
                              <CircleCheck className="h-3 w-3" />
                              Included
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <CircleX className="h-3 w-3" />
                              Excluded
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {invoice.includeHalalCharge ? `${invoice.halalChargePercent}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-primary font-semibold">
                          {invoice.includeHalalCharge 
                            ? invoice.halalChargeAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {invoice.grandTotal.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total Invoiced</TableHead>
                    <TableHead className="text-right">Halal Amount</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!profitLoss?.customerPaymentSummary || profitLoss.customerPaymentSummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No customer payment data
                      </TableCell>
                    </TableRow>
                  ) : (
                    profitLoss.customerPaymentSummary.map((customer) => (
                      <TableRow key={customer.customerId} data-testid={`row-payment-${customer.customerId}`}>
                        <TableCell className="font-medium">{customer.customerName}</TableCell>
                        <TableCell className="text-right font-mono">
                          {customer.totalInvoiced.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {customer.halalAmount > 0 
                            ? customer.halalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {customer.totalPaid.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {customer.balance > 0 
                            ? customer.balance.toLocaleString("en-IN", { style: "currency", currency: "INR" })
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          {customer.paymentStatus === "paid" && (
                            <Badge variant="default" className="bg-primary">Paid</Badge>
                          )}
                          {customer.paymentStatus === "partial" && (
                            <Badge variant="secondary" className="bg-amber-500 text-white">Partial</Badge>
                          )}
                          {customer.paymentStatus === "unpaid" && (
                            <Badge variant="destructive">Unpaid</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Summary Row */}
              {profitLoss?.customerPaymentSummary && profitLoss.customerPaymentSummary.length > 0 && (
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-6 justify-end">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Invoiced</p>
                    <p className="text-lg font-bold font-mono">
                      {profitLoss.customerPaymentSummary.reduce((sum, c) => sum + c.totalInvoiced, 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Halal</p>
                    <p className="text-lg font-bold font-mono text-primary">
                      {profitLoss.customerPaymentSummary.reduce((sum, c) => sum + c.halalAmount, 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Received</p>
                    <p className="text-lg font-bold font-mono text-primary">
                      {profitLoss.customerPaymentSummary.reduce((sum, c) => sum + c.totalPaid, 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                    <p className="text-lg font-bold font-mono text-destructive">
                      {profitLoss.customerPaymentSummary.reduce((sum, c) => sum + c.balance, 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Profit Margins</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitLoss?.productProfits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No product data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    profitLoss?.productProfits.map((product) => (
                      <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {product.purchasePrice.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {product.salePrice.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {product.margin.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={product.marginPercent >= 20 ? "default" : "secondary"}>
                            {product.marginPercent.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-4 py-2 rounded-md bg-primary/10">
                    <p className="text-xs text-muted-foreground">Stock In</p>
                    <p className="text-lg font-bold font-mono text-primary" data-testid="text-stock-in-total">{stockInTotal}</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-md bg-destructive/10">
                    <p className="text-xs text-muted-foreground">Stock Out</p>
                    <p className="text-lg font-bold font-mono text-destructive" data-testid="text-stock-out-total">{stockOutTotal}</p>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No stock movements in selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((movement) => (
                      <TableRow key={movement.id} data-testid={`row-movement-${movement.id}`}>
                        <TableCell>{movement.date}</TableCell>
                        <TableCell className="font-medium">{getProductName(movement.productId)}</TableCell>
                        <TableCell>
                          <Badge variant={movement.type === "in" ? "default" : "secondary"}>
                            {movement.type === "in" ? "Stock In" : "Stock Out"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{movement.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{movement.reason}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lowstock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        All products are well-stocked
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`row-lowstock-${product.id}`}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right font-mono">{product.currentStock} {product.unit}</TableCell>
                        <TableCell className="text-right font-mono">{product.reorderLevel} {product.unit}</TableCell>
                        <TableCell>
                          <Badge variant={product.currentStock === 0 ? "destructive" : "secondary"}>
                            {product.currentStock === 0 ? "Out of Stock" : "Low Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
