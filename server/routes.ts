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

  // Reports
  app.get("/api/reports/profit-loss", async (req, res) => {
    try {
      const products = await storage.getProducts();
      const invoices = await storage.getInvoices();
      const purchases = await storage.getPurchases();

      let totalPurchases = 0;
      let totalSales = 0;

      for (const purchase of purchases) {
        totalPurchases += purchase.totalAmount;
      }

      for (const invoice of invoices) {
        totalSales += invoice.grandTotal;
      }

      const productProfits = products.map((p) => ({
        id: p.id,
        name: p.name,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        margin: p.salePrice - p.purchasePrice,
        marginPercent: ((p.salePrice - p.purchasePrice) / p.purchasePrice) * 100,
      }));

      res.json({
        totalPurchases,
        totalSales,
        grossProfit: totalSales - totalPurchases,
        productProfits,
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
