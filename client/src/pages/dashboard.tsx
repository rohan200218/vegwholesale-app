import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import {
  Users,
  UserCheck,
  Package,
  IndianRupee,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import type { Vendor, Customer, Product, Invoice, Purchase, CustomerPayment } from "@shared/schema";

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Users;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-semibold font-mono" data-testid={`text-metric-${title.toLowerCase().replace(/\s/g, '-')}`}>
            {value}
          </div>
          {trend && (
            <div className={trend === "up" ? "text-primary" : "text-destructive"}>
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LowStockAlert({ products }: { products: Product[] }) {
  const lowStockProducts = products.filter(
    (p) => p.currentStock <= (p.reorderLevel || 10)
  );

  if (lowStockProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Package className="h-8 w-8 mb-2" />
        <p className="text-sm">All stock levels are healthy</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lowStockProducts.slice(0, 5).map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between p-3 rounded-md bg-muted/50"
          data-testid={`alert-low-stock-${product.id}`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-chart-2" />
            <div>
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.currentStock} {product.unit} remaining
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Reorder
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: customerPayments = [], isLoading: paymentsLoading } = useQuery<CustomerPayment[]>({
    queryKey: ["/api/customer-payments"],
  });

  const isLoading = vendorsLoading || customersLoading || productsLoading || invoicesLoading || purchasesLoading || paymentsLoading;

  const totalStockValue = products.reduce(
    (acc, p) => acc + p.currentStock * p.purchasePrice,
    0
  );

  const today = new Date().toISOString().split("T")[0];
  
  const todaySales = invoices
    .filter((i) => i.date === today)
    .reduce((acc, i) => acc + i.grandTotal, 0);

  // Calculate opening and closing balances
  const balances = useMemo(() => {
    const totalSalesBeforeToday = invoices
      .filter(inv => inv.date < today)
      .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    
    const totalPaymentsBeforeToday = customerPayments
      .filter(p => p.date < today)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const openingBalance = totalSalesBeforeToday - totalPaymentsBeforeToday;
    
    const todayTotalSales = invoices
      .filter(inv => inv.date === today)
      .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    
    const todayPayments = customerPayments
      .filter(p => p.date === today)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const closingBalance = openingBalance + todayTotalSales - todayPayments;
    
    return { openingBalance, closingBalance, todayPayments };
  }, [invoices, customerPayments, today]);

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Chart data: Top products by stock value
  const stockValueData = useMemo(() => {
    return products
      .map((p) => ({
        name: p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name,
        fullName: p.name,
        value: p.currentStock * p.purchasePrice,
        stock: p.currentStock,
        unit: p.unit,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  // Chart data: Last 7 days sales trend - single pass aggregation for O(n) performance
  const salesTrendData = useMemo(() => {
    // First, aggregate all invoices by date in a single pass
    const salesByDate = new Map<string, { sales: number; count: number }>();
    invoices.forEach((inv) => {
      const existing = salesByDate.get(inv.date) || { sales: 0, count: 0 };
      existing.sales += inv.grandTotal;
      existing.count += 1;
      salesByDate.set(inv.date, existing);
    });

    // Then build the 7-day array using the pre-aggregated map
    const days: { date: string; sales: number; invoices: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayData = salesByDate.get(dateStr) || { sales: 0, count: 0 };
      days.push({
        date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        sales: dayData.sales,
        invoices: dayData.count,
      });
    }
    return days;
  }, [invoices]);

  // Chart data: Stock distribution by product (pie chart)
  const stockDistributionData = useMemo(() => {
    return products
      .filter((p) => p.currentStock > 0)
      .map((p) => ({
        name: p.name,
        value: p.currentStock,
        unit: p.unit,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  // Chart colors matching the design system
  const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--primary))",
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your wholesale business
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild data-testid="button-new-purchase">
            <Link href="/purchases">
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Purchase
            </Link>
          </Button>
          <Button asChild variant="default" data-testid="button-new-invoice">
            <Link href="/weighing">
              <Receipt className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Opening Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${balances.openingBalance > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-green-600 dark:text-green-500'}`} data-testid="text-opening-balance">
              ₹{balances.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding at start of day</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-today-sales">
              ₹{todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{invoices.filter((i) => i.date === today).length} invoices today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Closing Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${balances.closingBalance > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-green-600 dark:text-green-500'}`} data-testid="text-closing-balance">
              ₹{balances.closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Current outstanding (₹{balances.todayPayments.toLocaleString("en-IN")} received today)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Stock Value"
          value={`₹${totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtitle={`${products.length} products`}
          icon={IndianRupee}
        />
        <MetricCard
          title="Active Vendors"
          value={vendors.length}
          subtitle="Suppliers"
          icon={Users}
        />
        <MetricCard
          title="Customers"
          value={customers.length}
          subtitle="Registered buyers"
          icon={UserCheck}
        />
        <MetricCard
          title="Total Invoices"
          value={invoices.length}
          subtitle="All time"
          icon={Receipt}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold">7-Day Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-sales-trend">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Sales"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold">Stock Value by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="chart-stock-value">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockValueData} layout="vertical">
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Value"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/print">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 mb-2" />
                <p className="text-sm">No invoices yet</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href="/weighing">Create First Invoice</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-sm">{invoice.date}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={invoice.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold">Low Stock Alerts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/stock">View Stock</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <LowStockAlert products={products} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold">Recent Purchases</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/purchases">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mb-2" />
              <p className="text-sm">No purchases yet</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/purchases">Create First Purchase</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPurchases.map((purchase) => (
                  <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                    <TableCell className="font-mono text-sm">
                      {purchase.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm">{purchase.date}</TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{purchase.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={purchase.status === "completed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {purchase.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
