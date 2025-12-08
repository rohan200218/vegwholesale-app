import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Search,
  Warehouse,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
} from "lucide-react";
import type { Product, StockMovement } from "@shared/schema";

type AdjustmentType = "add" | "reduce";

export default function Stock() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustmentDialog, setAdjustmentDialog] = useState<{
    product: Product;
    type: AdjustmentType;
  } | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({
      productId,
      type,
      quantity,
      reason,
    }: {
      productId: string;
      type: AdjustmentType;
      quantity: number;
      reason: string;
    }) => {
      return apiRequest("POST", "/api/stock-movements", {
        productId,
        type: type === "add" ? "in" : "out",
        quantity,
        reason,
        date: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      setAdjustmentDialog(null);
      setAdjustmentQuantity("");
      setAdjustmentReason("");
      toast({ title: "Stock adjusted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to adjust stock", variant: "destructive" });
    },
  });

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStockValue = products.reduce(
    (acc, p) => acc + p.currentStock * p.purchasePrice,
    0
  );

  const lowStockCount = products.filter(
    (p) => p.currentStock <= (p.reorderLevel || 10)
  ).length;

  const handleAdjustment = () => {
    if (!adjustmentDialog || !adjustmentQuantity) return;

    const quantity = parseFloat(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Please enter a valid quantity", variant: "destructive" });
      return;
    }

    if (
      adjustmentDialog.type === "reduce" &&
      quantity > adjustmentDialog.product.currentStock
    ) {
      toast({
        title: "Cannot reduce more than current stock",
        variant: "destructive",
      });
      return;
    }

    adjustStockMutation.mutate({
      productId: adjustmentDialog.product.id,
      type: adjustmentDialog.type,
      quantity,
      reason: adjustmentReason || `Manual ${adjustmentDialog.type}`,
    });
  };

  const recentMovements = [...movements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Calculate entry stock (total stock received) per product
  const getEntryStock = (productId: string) => {
    return movements
      .filter((m) => m.productId === productId && m.type === "in")
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  // Calculate sold/out stock per product
  const getSoldStock = (productId: string) => {
    return movements
      .filter((m) => m.productId === productId && m.type === "out")
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  // Get first entry date for a product
  const getFirstEntryDate = (productId: string) => {
    const inMovements = movements
      .filter((m) => m.productId === productId && m.type === "in")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return inMovements.length > 0 ? inMovements[0].date : null;
  };

  // Get last entry date for a product
  const getLastEntryDate = (productId: string) => {
    const inMovements = movements
      .filter((m) => m.productId === productId && m.type === "in")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return inMovements.length > 0 ? inMovements[0].date : null;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24" />
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
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Stock Management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage inventory levels
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-total-products">
              {products.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Items in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock Value
            </CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold font-mono" data-testid="text-stock-value">
              ₹{totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">At purchase price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-low-stock-count">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need reordering</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-lg font-semibold">Inventory</CardTitle>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-stock"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Warehouse className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Add products to manage stock</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead className="text-right">Entry Stock</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const isLowStock =
                      product.currentStock <= (product.reorderLevel || 10);
                    const stockValue = product.currentStock * product.purchasePrice;
                    const entryStock = getEntryStock(product.id);
                    const soldStock = getSoldStock(product.id);
                    const firstEntryDate = getFirstEntryDate(product.id);
                    const lastEntryDate = getLastEntryDate(product.id);

                    return (
                      <TableRow key={product.id} data-testid={`row-stock-${product.id}`}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {product.unit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {firstEntryDate ? (
                            <div className="text-sm">
                              <div>{firstEntryDate}</div>
                              {lastEntryDate && lastEntryDate !== firstEntryDate && (
                                <div className="text-xs text-muted-foreground">
                                  Last: {lastEntryDate}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {entryStock.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {soldStock.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {product.currentStock.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{stockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <div className="flex items-center gap-1 text-chart-2">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">Low</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setAdjustmentDialog({ product, type: "add" })
                              }
                              data-testid={`button-add-stock-${product.id}`}
                            >
                              <Plus className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setAdjustmentDialog({ product, type: "reduce" })
                              }
                              disabled={product.currentStock <= 0}
                              data-testid={`button-reduce-stock-${product.id}`}
                            >
                              <Minus className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Movements</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2" />
                <p className="text-sm">No movements yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMovements.map((movement) => {
                  const product = products.find((p) => p.id === movement.productId);
                  return (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`movement-${movement.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {movement.type === "in" ? (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {product?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movement.reason}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-mono ${
                            movement.type === "in"
                              ? "text-primary"
                              : "text-destructive"
                          }`}
                        >
                          {movement.type === "in" ? "+" : "-"}
                          {movement.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {movement.date}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!adjustmentDialog}
        onOpenChange={() => {
          setAdjustmentDialog(null);
          setAdjustmentQuantity("");
          setAdjustmentReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentDialog?.type === "add" ? "Add Stock" : "Reduce Stock"} -{" "}
              {adjustmentDialog?.product.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-semibold font-mono">
                {adjustmentDialog?.product.currentStock.toFixed(2)}{" "}
                {adjustmentDialog?.product.unit}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="Enter quantity"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                data-testid="input-adjustment-quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Purchase received, Damaged goods"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                data-testid="input-adjustment-reason"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAdjustmentDialog(null);
                  setAdjustmentQuantity("");
                  setAdjustmentReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdjustment}
                disabled={adjustStockMutation.isPending || !adjustmentQuantity}
                data-testid="button-confirm-adjustment"
              >
                {adjustStockMutation.isPending
                  ? "Processing..."
                  : adjustmentDialog?.type === "add"
                  ? "Add Stock"
                  : "Reduce Stock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
