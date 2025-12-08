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
import type { Vendor, Customer, Product, Invoice, Purchase } from "@shared/schema";

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

  const isLoading = vendorsLoading || customersLoading || productsLoading || invoicesLoading || purchasesLoading;

  const totalStockValue = products.reduce(
    (acc, p) => acc + p.currentStock * p.purchasePrice,
    0
  );

  const todaySales = invoices
    .filter((i) => i.date === new Date().toISOString().split("T")[0])
    .reduce((acc, i) => acc + i.grandTotal, 0);

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
            <Link href="/billing">
              <Receipt className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
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
          title="Today's Sales"
          value={`₹${todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtitle={`${invoices.filter((i) => i.date === new Date().toISOString().split("T")[0]).length} invoices`}
          icon={TrendingUp}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/billing">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 mb-2" />
                <p className="text-sm">No invoices yet</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href="/billing">Create First Invoice</Link>
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
                          variant={invoice.status === "paid" ? "default" : "secondary"}
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
