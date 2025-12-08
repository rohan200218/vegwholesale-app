import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertVendorSchema,
  insertCustomerSchema,
  insertVehicleSchema,
  insertProductSchema,
  insertStockMovementSchema,
  insertVendorPaymentSchema,
  insertCustomerPaymentSchema,
  insertCompanySettingsSchema,
  insertVendorReturnSchema,
  insertVendorReturnItemSchema,
  insertHalalCashPaymentSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Vendors
  app.get("/api/vendors", async (req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.get("/api/vendors/:id", async (req, res) => {
    const vendor = await storage.getVendor(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(vendor);
  });

  app.get("/api/vendors/:id/balance", async (req, res) => {
    const balance = await storage.getVendorBalance(req.params.id);
    res.json(balance);
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const data = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(data);
      res.status(201).json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  app.patch("/api/vendors/:id", async (req, res) => {
    try {
      const data = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(req.params.id, data);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: "Invalid vendor data" });
    }
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    const success = await storage.deleteVendor(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.status(204).send();
  });

  // Customers
  app.get("/api/customers", async (req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get("/api/customers/:id", async (req, res) => {
    const customer = await storage.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  });

  app.get("/api/customers/:id/balance", async (req, res) => {
    const balance = await storage.getCustomerBalance(req.params.id);
    res.json(balance);
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const data = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(data);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const data = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, data);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    const success = await storage.deleteCustomer(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(204).send();
  });

  // Vehicles
  app.get("/api/vehicles", async (req, res) => {
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    const vehicle = await storage.getVehicle(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    res.json(vehicle);
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const data = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(data);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ error: "Invalid vehicle data" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const data = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(req.params.id, data);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ error: "Invalid vehicle data" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    const success = await storage.deleteVehicle(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    res.status(204).send();
  });

  // Products
  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const data = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, data);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    const success = await storage.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(204).send();
  });

  // Stock Movements
  app.get("/api/stock-movements", async (req, res) => {
    const { startDate, endDate } = req.query;
    const movements = await storage.getStockMovements(
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(movements);
  });

  app.post("/api/stock-movements", async (req, res) => {
    try {
      const data = insertStockMovementSchema.parse(req.body);
      const movement = await storage.createStockMovement(data);
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ error: "Invalid stock movement data" });
    }
  });

  // Purchases
  app.get("/api/purchases", async (req, res) => {
    const purchases = await storage.getPurchases();
    res.json(purchases);
  });

  app.get("/api/purchases/:id", async (req, res) => {
    const purchase = await storage.getPurchase(req.params.id);
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }
    res.json(purchase);
  });

  app.get("/api/purchases/:id/items", async (req, res) => {
    const items = await storage.getPurchaseItems(req.params.id);
    res.json(items);
  });

  const purchaseSchema = z.object({
    vendorId: z.string(),
    vehicleId: z.string().optional(),
    date: z.string(),
    totalAmount: z.number(),
    status: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      })
    ),
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const data = purchaseSchema.parse(req.body);
      const { items, ...purchaseData } = data;
      const purchase = await storage.createPurchase(
        purchaseData,
        items.map((item) => ({ ...item, purchaseId: "" }))
      );
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Purchase error:", error);
      res.status(400).json({ error: "Invalid purchase data" });
    }
  });

  // Invoices
  app.get("/api/invoices", async (req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });

  app.get("/api/invoices/:id/items", async (req, res) => {
    const items = await storage.getInvoiceItems(req.params.id);
    res.json(items);
  });

  const invoiceSchema = z.object({
    customerId: z.string(),
    vehicleId: z.string().optional(),
    invoiceNumber: z.string(),
    date: z.string(),
    subtotal: z.number(),
    includeHalalCharge: z.boolean(),
    halalChargePercent: z.number().optional(),
    halalChargeAmount: z.number().optional(),
    grandTotal: z.number(),
    status: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      })
    ),
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const data = invoiceSchema.parse(req.body);
      const { items, ...invoiceData } = data;
      const invoice = await storage.createInvoice(
        invoiceData,
        items.map((item) => ({ ...item, invoiceId: "" }))
      );
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Invoice error:", error);
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  // Vendor Payments
  app.get("/api/vendor-payments", async (req, res) => {
    const { vendorId } = req.query;
    const payments = await storage.getVendorPayments(vendorId as string | undefined);
    res.json(payments);
  });

  app.post("/api/vendor-payments", async (req, res) => {
    try {
      const data = insertVendorPaymentSchema.parse(req.body);
      const payment = await storage.createVendorPayment(data);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // Customer Payments
  app.get("/api/customer-payments", async (req, res) => {
    const { customerId } = req.query;
    const payments = await storage.getCustomerPayments(customerId as string | undefined);
    res.json(payments);
  });

  app.post("/api/customer-payments", async (req, res) => {
    try {
      const data = insertCustomerPaymentSchema.parse(req.body);
      const payment = await storage.createCustomerPayment(data);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // Company Settings
  app.get("/api/company-settings", async (req, res) => {
    const settings = await storage.getCompanySettings();
    res.json(settings || null);
  });

  app.post("/api/company-settings", async (req, res) => {
    try {
      const data = insertCompanySettingsSchema.parse(req.body);
      const settings = await storage.upsertCompanySettings(data);
      res.status(201).json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid company settings" });
    }
  });

  // Vehicle Inventory
  app.get("/api/vehicles/:id/inventory", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const inventory = await storage.getVehicleInventory(req.params.id);
      res.json(inventory);
    } catch (error) {
      console.error("Error getting vehicle inventory:", error);
      res.status(500).json({ error: "Failed to get vehicle inventory" });
    }
  });

  app.get("/api/vehicles/:id/inventory/movements", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const movements = await storage.getVehicleInventoryMovements(req.params.id);
      res.json(movements);
    } catch (error) {
      console.error("Error getting inventory movements:", error);
      res.status(500).json({ error: "Failed to get inventory movements" });
    }
  });

  const loadInventorySchema = z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    purchaseId: z.string().optional(),
  });

  app.post("/api/vehicles/:id/inventory/load", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      const data = loadInventorySchema.parse(req.body);
      const inventory = await storage.loadVehicleInventory(
        req.params.id,
        data.productId,
        data.quantity,
        data.purchaseId
      );
      res.status(201).json(inventory);
    } catch (error) {
      console.error("Error loading inventory:", error);
      res.status(400).json({ error: "Invalid inventory data" });
    }
  });

  // Vendor Returns
  app.get("/api/vendor-returns", async (req, res) => {
    const { vendorId } = req.query;
    const returns = await storage.getVendorReturns(vendorId as string | undefined);
    res.json(returns);
  });

  app.get("/api/vendor-returns/:id", async (req, res) => {
    const vendorReturn = await storage.getVendorReturn(req.params.id);
    if (!vendorReturn) {
      return res.status(404).json({ error: "Vendor return not found" });
    }
    res.json(vendorReturn);
  });

  app.get("/api/vendor-returns/:id/items", async (req, res) => {
    const items = await storage.getVendorReturnItems(req.params.id);
    res.json(items);
  });

  const vendorReturnSchema = z.object({
    vendorId: z.string(),
    purchaseId: z.string().optional(),
    vehicleId: z.string().optional(),
    date: z.string(),
    totalAmount: z.number(),
    status: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
        reason: z.string(),
      })
    ),
  });

  app.post("/api/vendor-returns", async (req, res) => {
    try {
      const data = vendorReturnSchema.parse(req.body);
      const { items, ...returnData } = data;
      const vendorReturn = await storage.createVendorReturn(
        returnData,
        items.map((item) => ({ ...item, returnId: "" }))
      );
      res.status(201).json(vendorReturn);
    } catch (error) {
      console.error("Vendor return error:", error);
      res.status(400).json({ error: "Invalid vendor return data" });
    }
  });

  // Halal Cash Payments (direct cash payments not through invoices)
  app.get("/api/halal-cash", async (req, res) => {
    const payments = await storage.getHalalCashPayments();
    res.json(payments);
  });

  app.post("/api/halal-cash", async (req, res) => {
    try {
      const data = insertHalalCashPaymentSchema.parse(req.body);
      const payment = await storage.createHalalCashPayment(data);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Halal cash payment error:", error);
      res.status(400).json({ error: "Invalid Halal cash payment data" });
    }
  });

  app.delete("/api/halal-cash/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteHalalCashPayment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Halal cash payment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete Halal cash payment" });
    }
  });

  // Reports
  app.get("/api/reports/profit-loss", async (req, res) => {
    try {
      const products = await storage.getProducts();
      const invoices = await storage.getInvoices();
      const purchases = await storage.getPurchases();
      const vendorReturns = await storage.getVendorReturns();
      const customers = await storage.getCustomers();
      const allCustomerPayments = await storage.getCustomerPayments();
      const halalCashPayments = await storage.getHalalCashPayments();

      let totalPurchases = 0;
      let totalSales = 0;
      let totalReturns = 0;

      for (const purchase of purchases) {
        totalPurchases += purchase.totalAmount;
      }

      for (const invoice of invoices) {
        totalSales += invoice.grandTotal;
      }

      for (const vendorReturn of vendorReturns) {
        totalReturns += vendorReturn.totalAmount;
      }

      // Net purchases = purchases - returns (returns reduce cost of goods)
      const netPurchases = totalPurchases - totalReturns;

      const productProfits = products.map((p) => ({
        id: p.id,
        name: p.name,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        margin: p.salePrice - p.purchasePrice,
        marginPercent: ((p.salePrice - p.purchasePrice) / p.purchasePrice) * 100,
      }));

      // Halal charge breakdown
      let invoiceHalalTotal = 0;  // Halal from invoices
      let invoicesWithHalal = 0;
      let invoicesWithoutHalal = 0;
      let salesWithHalal = 0;  // Grand total of invoices WITH Halal charge
      let salesWithoutHalal = 0;  // Grand total of invoices WITHOUT Halal charge
      
      // Direct cash payments to Halal
      const directCashHalalTotal = halalCashPayments.reduce((sum, p) => sum + p.amount, 0);

      // Build invoice details with payment info
      const invoiceDetails = invoices.map((invoice) => {
        const customer = customers.find((c) => c.id === invoice.customerId);
        const customerName = customer?.name || "Unknown";
        
        // Track Halal amounts - only count actual Halal charge amount
        if (invoice.includeHalalCharge) {
          invoicesWithHalal++;
          invoiceHalalTotal += invoice.halalChargeAmount || 0;
          salesWithHalal += invoice.grandTotal;
        } else {
          invoicesWithoutHalal++;
          salesWithoutHalal += invoice.grandTotal;
        }

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          date: invoice.date,
          customerName,
          customerId: invoice.customerId,
          subtotal: invoice.subtotal,
          includeHalalCharge: invoice.includeHalalCharge,
          halalChargePercent: invoice.halalChargePercent,
          halalChargeAmount: invoice.halalChargeAmount || 0,
          grandTotal: invoice.grandTotal,
        };
      });

      // Calculate customer-wise payment summary
      const customerPaymentSummary = customers.map((customer) => {
        const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
        const customerPayments = allCustomerPayments.filter((p) => p.customerId === customer.id);
        
        const totalInvoiced = customerInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
        const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
        const balance = totalInvoiced - totalPaid;

        const halalAmount = customerInvoices
          .filter((i) => i.includeHalalCharge)
          .reduce((sum, i) => sum + (i.halalChargeAmount || 0), 0);

        return {
          customerId: customer.id,
          customerName: customer.name,
          totalInvoiced,
          totalPaid,
          balance,
          halalAmount,
          paymentStatus: balance <= 0 ? "paid" : balance < totalInvoiced ? "partial" : "unpaid",
        };
      }).filter((c) => c.totalInvoiced > 0); // Only show customers with invoices

      res.json({
        totalPurchases,
        totalReturns,
        netPurchases,
        totalSales,
        grossProfit: totalSales - netPurchases,
        productProfits,
        // Halal charge data
        halalSummary: {
          invoiceHalalTotal,
          directCashHalalTotal,
          totalHalalCollected: invoiceHalalTotal + directCashHalalTotal,
          invoicesWithHalal,
          invoicesWithoutHalal,
          salesWithHalal,
          salesWithoutHalal,
        },
        invoiceDetails,
        customerPaymentSummary,
        halalCashPayments,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/reports/vendor-balances", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      const balances = await Promise.all(
        vendors.map(async (vendor) => {
          const balance = await storage.getVendorBalance(vendor.id);
          return {
            ...vendor,
            ...balance,
          };
        })
      );
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/reports/customer-balances", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const balances = await Promise.all(
        customers.map(async (customer) => {
          const balance = await storage.getCustomerBalance(customer.id);
          return {
            ...customer,
            ...balance,
          };
        })
      );
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  return httpServer;
}
