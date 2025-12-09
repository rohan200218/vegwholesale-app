import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Package, ArrowUpRight, ArrowDownRight, RotateCcw, CircleCheck, CircleX, Receipt, CreditCard, Users, Download, Calendar, Filter } from "lucide-react";
import type { Product, StockMovement, Invoice, Customer } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type HamaliSummary = {
  invoiceHamaliTotal: number;
  directCashHamaliTotal: number;
  totalHamaliCollected: number;
  invoicesWithHamali: number;
  invoicesWithoutHamali: number;
  salesWithHamali: number;
  salesWithoutHamali: number;
};

type HamaliCashPayment = {
  id: string;
  amount: number;
  date: string;
  paymentMethod: string;
  customerId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  totalBillAmount?: number;
  notes?: string;
};

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerId: string;
  subtotal: number;
  includeHamaliCharge: boolean;
  hamaliRatePerKg: number;
  hamaliChargeAmount: number;
  hamaliPaidByCash: boolean;
  totalKgWeight: number;
  grandTotal: number;
};

type CustomerPaymentSummary = {
  customerId: string;
  customerName: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  hamaliAmount: number;
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
  hamaliSummary?: HamaliSummary;
  invoiceDetails?: InvoiceDetail[];
  customerPaymentSummary?: CustomerPaymentSummary[];
};

type PeriodType = "all" | "daily" | "monthly";

type DailySummary = {
  date: string;
  sales: number;
  invoiceCount: number;
  hamaliFromInvoices: number;
  hamaliCash: number;
  totalHamali: number;
};

type MonthlySummary = {
  month: string;
  monthLabel: string;
  sales: number;
  invoiceCount: number;
  hamaliFromInvoices: number;
  hamaliCash: number;
  totalHamali: number;
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

function downloadCSV(data: string[][], filename: string) {
  const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [periodType, setPeriodType] = useState<PeriodType>("all");

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: hamaliCashPayments = [] } = useQuery<HamaliCashPayment[]>({
    queryKey: ["/api/hamali-cash"],
  });

  const { data: profitLoss, isLoading: profitLoading } = useQuery<ProfitLossReport>({
    queryKey: ["/api/reports/profit-loss"],
  });

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || "Unknown";
  const getProductName = (id: string) => products.find((p) => p.id === id)?.name || "Unknown";

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (startDate && inv.date < startDate) return false;
      if (endDate && inv.date > endDate) return false;
      return true;
    });
  }, [invoices, startDate, endDate]);

  const filteredHamaliCash = useMemo(() => {
    return hamaliCashPayments.filter((payment) => {
      if (startDate && payment.date < startDate) return false;
      if (endDate && payment.date > endDate) return false;
      return true;
    });
  }, [hamaliCashPayments, startDate, endDate]);

  const filteredMovements = stockMovements.filter((m) => {
    if (startDate && m.date < startDate) return false;
    if (endDate && m.date > endDate) return false;
    return true;
  });

  const filteredSummary = useMemo(() => {
    const totalSalesWithHamali = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalSubtotal = filteredInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const invoiceHamaliTotal = filteredInvoices
      .filter(inv => inv.includeHamaliCharge)
      .reduce((sum, inv) => sum + (inv.hamaliChargeAmount || 0), 0);
    const directCashHamaliTotal = filteredHamaliCash.reduce((sum, p) => sum + p.amount, 0);
    const invoicesWithHamali = filteredInvoices.filter(inv => inv.includeHamaliCharge).length;
    const invoicesWithoutHamali = filteredInvoices.filter(inv => !inv.includeHamaliCharge).length;

    return {
      totalSalesWithHamali,
      totalSubtotal,
      invoiceHamaliTotal,
      directCashHamaliTotal,
      totalHamaliCollected: invoiceHamaliTotal + directCashHamaliTotal,
      invoicesWithHamali,
      invoicesWithoutHamali,
      invoiceCount: filteredInvoices.length,
    };
  }, [filteredInvoices, filteredHamaliCash]);

  const dailySummary = useMemo((): DailySummary[] => {
    const dateMap = new Map<string, DailySummary>();

    filteredInvoices.forEach((inv) => {
      const existing = dateMap.get(inv.date) || {
        date: inv.date,
        sales: 0,
        invoiceCount: 0,
        hamaliFromInvoices: 0,
        hamaliCash: 0,
        totalHamali: 0,
      };
      existing.sales += inv.grandTotal;
      existing.invoiceCount += 1;
      if (inv.includeHamaliCharge) {
        existing.hamaliFromInvoices += inv.hamaliChargeAmount || 0;
      }
      dateMap.set(inv.date, existing);
    });

    filteredHamaliCash.forEach((payment) => {
      const existing = dateMap.get(payment.date) || {
        date: payment.date,
        sales: 0,
        invoiceCount: 0,
        hamaliFromInvoices: 0,
        hamaliCash: 0,
        totalHamali: 0,
      };
      existing.hamaliCash += payment.amount;
      dateMap.set(payment.date, existing);
    });

    const result = Array.from(dateMap.values()).map((day) => ({
      ...day,
      totalHamali: day.hamaliFromInvoices + day.hamaliCash,
    }));

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredInvoices, filteredHamaliCash]);

  const monthlySummary = useMemo((): MonthlySummary[] => {
    const monthMap = new Map<string, MonthlySummary>();

    filteredInvoices.forEach((inv) => {
      const month = inv.date.substring(0, 7);
      const monthLabel = new Date(inv.date).toLocaleDateString("en-IN", { year: "numeric", month: "long" });
      const existing = monthMap.get(month) || {
        month,
        monthLabel,
        sales: 0,
        invoiceCount: 0,
        hamaliFromInvoices: 0,
        hamaliCash: 0,
        totalHamali: 0,
      };
      existing.sales += inv.grandTotal;
      existing.invoiceCount += 1;
      if (inv.includeHamaliCharge) {
        existing.hamaliFromInvoices += inv.hamaliChargeAmount || 0;
      }
      monthMap.set(month, existing);
    });

    filteredHamaliCash.forEach((payment) => {
      const month = payment.date.substring(0, 7);
      const monthLabel = new Date(payment.date).toLocaleDateString("en-IN", { year: "numeric", month: "long" });
      const existing = monthMap.get(month) || {
        month,
        monthLabel,
        sales: 0,
        invoiceCount: 0,
        hamaliFromInvoices: 0,
        hamaliCash: 0,
        totalHamali: 0,
      };
      existing.hamaliCash += payment.amount;
      monthMap.set(month, existing);
    });

    const result = Array.from(monthMap.values()).map((m) => ({
      ...m,
      totalHamali: m.hamaliFromInvoices + m.hamaliCash,
    }));

    return result.sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredInvoices, filteredHamaliCash]);

  const stockInTotal = filteredMovements.filter((m) => m.type === "in").reduce((sum, m) => sum + m.quantity, 0);
  const stockOutTotal = filteredMovements.filter((m) => m.type === "out").reduce((sum, m) => sum + m.quantity, 0);

  const lowStockProducts = products.filter((p) => p.currentStock <= (p.reorderLevel || 10));

  const downloadDailyReport = () => {
    const headers = ["Date", "Sales", "Invoices", "Hamali (Invoice)", "Hamali (Cash)", "Total Hamali"];
    const rows = dailySummary.map((day) => [
      day.date,
      day.sales.toFixed(2),
      day.invoiceCount.toString(),
      day.hamaliFromInvoices.toFixed(2),
      day.hamaliCash.toFixed(2),
      day.totalHamali.toFixed(2),
    ]);
    const totals = [
      "TOTAL",
      dailySummary.reduce((sum, d) => sum + d.sales, 0).toFixed(2),
      dailySummary.reduce((sum, d) => sum + d.invoiceCount, 0).toString(),
      dailySummary.reduce((sum, d) => sum + d.hamaliFromInvoices, 0).toFixed(2),
      dailySummary.reduce((sum, d) => sum + d.hamaliCash, 0).toFixed(2),
      dailySummary.reduce((sum, d) => sum + d.totalHamali, 0).toFixed(2),
    ];
    downloadCSV([headers, ...rows, totals], `daily-report-${startDate}-to-${endDate}.csv`);
  };

  const downloadMonthlyReport = () => {
    const headers = ["Month", "Sales", "Invoices", "Hamali (Invoice)", "Hamali (Cash)", "Total Hamali"];
    const rows = monthlySummary.map((m) => [
      m.monthLabel,
      m.sales.toFixed(2),
      m.invoiceCount.toString(),
      m.hamaliFromInvoices.toFixed(2),
      m.hamaliCash.toFixed(2),
      m.totalHamali.toFixed(2),
    ]);
    const totals = [
      "TOTAL",
      monthlySummary.reduce((sum, d) => sum + d.sales, 0).toFixed(2),
      monthlySummary.reduce((sum, d) => sum + d.invoiceCount, 0).toString(),
      monthlySummary.reduce((sum, d) => sum + d.hamaliFromInvoices, 0).toFixed(2),
      monthlySummary.reduce((sum, d) => sum + d.hamaliCash, 0).toFixed(2),
      monthlySummary.reduce((sum, d) => sum + d.totalHamali, 0).toFixed(2),
    ];
    downloadCSV([headers, ...rows, totals], `monthly-report-${startDate}-to-${endDate}.csv`);
  };

  const downloadInvoiceReport = () => {
    const headers = ["Invoice #", "Date", "Customer", "Subtotal", "Hamali Included", "Rate/KG", "Total KG", "Hamali Amount", "Paid Cash", "Grand Total"];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.date,
      getCustomerName(inv.customerId),
      inv.subtotal.toFixed(2),
      inv.includeHamaliCharge ? "Yes" : "No",
      inv.includeHamaliCharge ? `${inv.hamaliRatePerKg}` : "-",
      inv.includeHamaliCharge ? `${inv.totalKgWeight}` : "-",
      inv.includeHamaliCharge ? (inv.hamaliChargeAmount || 0).toFixed(2) : "0",
      inv.hamaliPaidByCash ? "Yes" : "No",
      inv.grandTotal.toFixed(2),
    ]);
    const totals = [
      "TOTALS",
      "",
      `${filteredInvoices.length} invoices`,
      filteredSummary.totalSubtotal.toFixed(2),
      `${filteredSummary.invoicesWithHamali} included`,
      "",
      "",
      filteredSummary.invoiceHamaliTotal.toFixed(2),
      "",
      filteredSummary.totalSalesWithHamali.toFixed(2),
    ];
    downloadCSV([headers, ...rows, totals], `invoice-report-${startDate}-to-${endDate}.csv`);
  };

  const downloadHamaliCashReport = () => {
    const headers = ["Date", "Invoice #", "Customer", "Hamali Amount", "Total Bill", "Payment Method", "Notes"];
    const rows = filteredHamaliCash.map((payment) => [
      payment.date,
      payment.invoiceNumber || "Manual Entry",
      payment.customerId ? getCustomerName(payment.customerId) : "-",
      payment.amount.toFixed(2),
      payment.totalBillAmount ? payment.totalBillAmount.toFixed(2) : "-",
      payment.paymentMethod,
      payment.notes || "-",
    ]);
    const totals = ["TOTAL", "", "", filteredHamaliCash.reduce((sum, p) => sum + p.amount, 0).toFixed(2), "", "", ""];
    downloadCSV([headers, ...rows, totals], `hamali-cash-report-${startDate}-to-${endDate}.csv`);
  };

  const downloadStockReport = () => {
    const headers = ["Date", "Product", "Type", "Quantity", "Reason"];
    const rows = filteredMovements.map((m) => [
      m.date,
      getProductName(m.productId),
      m.type.toUpperCase(),
      m.quantity.toString(),
      m.reason || "-",
    ]);
    downloadCSV([headers, ...rows], `stock-movements-${startDate}-to-${endDate}.csv`);
  };

  if (productsLoading || movementsLoading || profitLoading || invoicesLoading) {
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-filter-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-filter-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label>View By</Label>
              <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                <SelectTrigger className="w-40" data-testid="select-period-type">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="daily">Day-wise</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate(thirtyDaysAgo);
                  setEndDate(today);
                }}
                data-testid="button-reset-filters"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Product Sales (Subtotal)
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-filtered-subtotal">
              {formatCurrency(filteredSummary.totalSubtotal)}
            </div>
            <p className="text-xs text-muted-foreground">Without Hamali</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Sales (Grand Total)
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary" data-testid="text-filtered-sales">
              {formatCurrency(filteredSummary.totalSalesWithHamali)}
            </div>
            <p className="text-xs text-muted-foreground">{filteredSummary.invoiceCount} invoices (with Hamali)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hamali in Bills
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-filtered-hamali-invoices">
              {formatCurrency(filteredSummary.invoiceHamaliTotal)}
            </div>
            <p className="text-xs text-muted-foreground">{filteredSummary.invoicesWithHamali} invoices included</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hamali Direct Cash
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-filtered-hamali-cash">
              {formatCurrency(filteredSummary.directCashHamaliTotal)}
            </div>
            <p className="text-xs text-muted-foreground">{filteredHamaliCash.length} cash payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hamali Collected
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-filtered-total-hamali">
              {formatCurrency(filteredSummary.totalHamaliCollected)}
            </div>
            <p className="text-xs text-muted-foreground">Bills + Direct Cash</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invoice Count
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="text-invoice-count">
              {filteredSummary.invoiceCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredSummary.invoicesWithHamali} with / {filteredSummary.invoicesWithoutHamali} without Hamali
            </p>
          </CardContent>
        </Card>
      </div>

      {periodType === "daily" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Day-wise Report
            </CardTitle>
            <Button variant="outline" size="sm" onClick={downloadDailyReport} data-testid="button-download-daily">
              <Download className="h-4 w-4 mr-1" />
              Download CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Hamali (Invoice)</TableHead>
                  <TableHead className="text-right">Hamali (Cash)</TableHead>
                  <TableHead className="text-right">Total Hamali</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No data for selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {dailySummary.map((day) => (
                      <TableRow key={day.date} data-testid={`row-daily-${day.date}`}>
                        <TableCell className="font-medium">{day.date}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(day.sales)}</TableCell>
                        <TableCell className="text-right">{day.invoiceCount}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(day.hamaliFromInvoices)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(day.hamaliCash)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-primary">{formatCurrency(day.totalHamali)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(dailySummary.reduce((sum, d) => sum + d.sales, 0))}</TableCell>
                      <TableCell className="text-right">{dailySummary.reduce((sum, d) => sum + d.invoiceCount, 0)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(dailySummary.reduce((sum, d) => sum + d.hamaliFromInvoices, 0))}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(dailySummary.reduce((sum, d) => sum + d.hamaliCash, 0))}</TableCell>
                      <TableCell className="text-right font-mono text-primary">{formatCurrency(dailySummary.reduce((sum, d) => sum + d.totalHamali, 0))}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {periodType === "monthly" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Report
            </CardTitle>
            <Button variant="outline" size="sm" onClick={downloadMonthlyReport} data-testid="button-download-monthly">
              <Download className="h-4 w-4 mr-1" />
              Download CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Hamali (Invoice)</TableHead>
                  <TableHead className="text-right">Hamali (Cash)</TableHead>
                  <TableHead className="text-right">Total Hamali</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No data for selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {monthlySummary.map((m) => (
                      <TableRow key={m.month} data-testid={`row-monthly-${m.month}`}>
                        <TableCell className="font-medium">{m.monthLabel}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(m.sales)}</TableCell>
                        <TableCell className="text-right">{m.invoiceCount}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(m.hamaliFromInvoices)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(m.hamaliCash)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-primary">{formatCurrency(m.totalHamali)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(monthlySummary.reduce((sum, d) => sum + d.sales, 0))}</TableCell>
                      <TableCell className="text-right">{monthlySummary.reduce((sum, d) => sum + d.invoiceCount, 0)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(monthlySummary.reduce((sum, d) => sum + d.hamaliFromInvoices, 0))}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(monthlySummary.reduce((sum, d) => sum + d.hamaliCash, 0))}</TableCell>
                      <TableCell className="text-right font-mono text-primary">{formatCurrency(monthlySummary.reduce((sum, d) => sum + d.totalHamali, 0))}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="invoices" data-testid="tab-invoices">
            <Receipt className="h-4 w-4 mr-1" />
            Invoice Details
          </TabsTrigger>
          <TabsTrigger value="hamali-cash" data-testid="tab-hamali-cash">
            <CreditCard className="h-4 w-4 mr-1" />
            Hamali Cash Payments
          </TabsTrigger>
          <TabsTrigger value="profit" data-testid="tab-profit">Profit Margins</TabsTrigger>
          <TabsTrigger value="stock" data-testid="tab-stock">Stock Movements</TabsTrigger>
          <TabsTrigger value="lowstock" data-testid="tab-lowstock">Low Stock Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Invoice Details ({filteredInvoices.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={downloadInvoiceReport} data-testid="button-download-invoices">
                <Download className="h-4 w-4 mr-1" />
                Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-center">Hamali Status</TableHead>
                    <TableHead className="text-right">Rate/KG</TableHead>
                    <TableHead className="text-right">Hamali Amount</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No invoices found for selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                          <TableCell className="font-medium font-mono">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(invoice.subtotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            {invoice.includeHamaliCharge ? (
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
                            {invoice.includeHamaliCharge ? `${invoice.hamaliRatePerKg}/KG` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-primary font-semibold">
                            {invoice.includeHamaliCharge 
                              ? formatCurrency(invoice.hamaliChargeAmount || 0)
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatCurrency(invoice.grandTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold border-t-2">
                        <TableCell colSpan={3}>TOTALS</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(filteredSummary.totalSubtotal)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs">{filteredSummary.invoicesWithHamali} included</span>
                        </TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {formatCurrency(filteredSummary.invoiceHamaliTotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {formatCurrency(filteredSummary.totalSalesWithHamali)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hamali-cash" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Hamali Cash Payments ({filteredHamaliCash.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={downloadHamaliCashReport} data-testid="button-download-hamali-cash">
                <Download className="h-4 w-4 mr-1" />
                Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Hamali Amount</TableHead>
                    <TableHead className="text-right">Total Bill</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHamaliCash.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No hamali cash payments for selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredHamaliCash.map((payment) => (
                        <TableRow key={payment.id} data-testid={`row-hamali-cash-${payment.id}`}>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell className="font-mono">
                            {payment.invoiceNumber ? (
                              <Badge variant="outline">{payment.invoiceNumber}</Badge>
                            ) : (
                              <span className="text-muted-foreground">Manual Entry</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.customerId ? getCustomerName(payment.customerId) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-primary">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {payment.totalBillAmount ? formatCurrency(payment.totalBillAmount) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{payment.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{payment.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>TOTAL</TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {formatCurrency(filteredHamaliCash.reduce((sum, p) => sum + p.amount, 0))}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(filteredHamaliCash.reduce((sum, p) => sum + (p.totalBillAmount || 0), 0))}
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
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
                          {formatCurrency(product.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(product.salePrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(product.margin)}
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
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Stock Movement Report</CardTitle>
              <Button variant="outline" size="sm" onClick={downloadStockReport} data-testid="button-download-stock">
                <Download className="h-4 w-4 mr-1" />
                Download CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="text-center px-4 py-2 rounded-md bg-primary/10">
                  <p className="text-xs text-muted-foreground">Stock In</p>
                  <p className="text-xl font-bold font-mono" data-testid="text-stock-in">
                    {stockInTotal.toFixed(2)}
                  </p>
                </div>
                <div className="text-center px-4 py-2 rounded-md bg-destructive/10">
                  <p className="text-xs text-muted-foreground">Stock Out</p>
                  <p className="text-xl font-bold font-mono" data-testid="text-stock-out">
                    {stockOutTotal.toFixed(2)}
                  </p>
                </div>
                <div className="text-center px-4 py-2 rounded-md bg-muted">
                  <p className="text-xs text-muted-foreground">Net Change</p>
                  <p className={`text-xl font-bold font-mono ${stockInTotal - stockOutTotal >= 0 ? "text-primary" : "text-destructive"}`}>
                    {(stockInTotal - stockOutTotal).toFixed(2)}
                  </p>
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
                        No stock movements for selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.slice(0, 50).map((movement) => (
                      <TableRow key={movement.id} data-testid={`row-movement-${movement.id}`}>
                        <TableCell>{movement.date}</TableCell>
                        <TableCell className="font-medium">{getProductName(movement.productId)}</TableCell>
                        <TableCell>
                          <Badge variant={movement.type === "in" ? "default" : "destructive"}>
                            {movement.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{movement.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{movement.reason || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {filteredMovements.length > 50 && (
                <p className="text-center text-sm text-muted-foreground">
                  Showing first 50 movements. Download CSV for full report.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lowstock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" />
                Low Stock Alerts ({lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        All products are above reorder level
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`row-lowstock-${product.id}`}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right font-mono">{product.currentStock}</TableCell>
                        <TableCell className="text-right font-mono">{product.reorderLevel || 10}</TableCell>
                        <TableCell className="text-right">
                          {product.currentStock === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : (
                            <Badge className="bg-amber-500">Low Stock</Badge>
                          )}
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
