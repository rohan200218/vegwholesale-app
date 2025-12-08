import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Vendors - suppliers/farmers who provide vegetables
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  email: text("email"),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true });
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Customers - buyers who purchase vegetables
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  email: text("email"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Vehicles - used for receiving stock from vendors
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull(),
  type: text("type").notNull(),
  capacity: text("capacity"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Products - vegetables and items
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  purchasePrice: real("purchase_price").notNull(),
  salePrice: real("sale_price").notNull(),
  currentStock: real("current_stock").notNull().default(0),
  reorderLevel: real("reorder_level").default(10),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Purchase Orders - buying from vendors
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  vehicleId: varchar("vehicle_id"),
  date: text("date").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull().default("pending"),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

// Purchase Items
export const purchaseItems = pgTable("purchase_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
});

export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({ id: true });
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type PurchaseItem = typeof purchaseItems.$inferSelect;

// Invoices - selling to customers
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull(),
  customerId: varchar("customer_id").notNull(),
  vehicleId: varchar("vehicle_id"),
  date: text("date").notNull(),
  subtotal: real("subtotal").notNull(),
  includeHalalCharge: boolean("include_halal_charge").notNull().default(false),
  halalChargePercent: real("halal_charge_percent").default(2),
  halalChargeAmount: real("halal_charge_amount").default(0),
  grandTotal: real("grand_total").notNull(),
  status: text("status").notNull().default("pending"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice Items
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// Stock Movements - track stock changes
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  type: text("type").notNull(), // 'in' or 'out'
  quantity: real("quantity").notNull(),
  reason: text("reason").notNull(),
  date: text("date").notNull(),
  referenceId: varchar("reference_id"),
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

// Vendor Payments - track payments to vendors
export const vendorPayments = pgTable("vendor_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  purchaseId: varchar("purchase_id"),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  paymentMethod: text("payment_method").notNull(),
  notes: text("notes"),
});

export const insertVendorPaymentSchema = createInsertSchema(vendorPayments).omit({ id: true });
export type InsertVendorPayment = z.infer<typeof insertVendorPaymentSchema>;
export type VendorPayment = typeof vendorPayments.$inferSelect;

// Customer Payments - track payments from customers
export const customerPayments = pgTable("customer_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  invoiceId: varchar("invoice_id"),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  paymentMethod: text("payment_method").notNull(),
  notes: text("notes"),
});

export const insertCustomerPaymentSchema = createInsertSchema(customerPayments).omit({ id: true });
export type InsertCustomerPayment = z.infer<typeof insertCustomerPaymentSchema>;
export type CustomerPayment = typeof customerPayments.$inferSelect;

// Vehicle Inventory - track products in each vehicle
export const vehicleInventory = pgTable("vehicle_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: real("quantity").notNull().default(0),
});

export const insertVehicleInventorySchema = createInsertSchema(vehicleInventory).omit({ id: true });
export type InsertVehicleInventory = z.infer<typeof insertVehicleInventorySchema>;
export type VehicleInventory = typeof vehicleInventory.$inferSelect;

// Vehicle Inventory Movements - track loading and selling from vehicles
export const vehicleInventoryMovements = pgTable("vehicle_inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull(),
  productId: varchar("product_id").notNull(),
  type: text("type").notNull(), // 'load' or 'sale' or 'adjustment'
  quantity: real("quantity").notNull(),
  referenceId: varchar("reference_id"), // purchase_id or invoice_id
  referenceType: text("reference_type"), // 'purchase' or 'invoice'
  date: text("date").notNull(),
  notes: text("notes"),
});

export const insertVehicleInventoryMovementSchema = createInsertSchema(vehicleInventoryMovements).omit({ id: true });
export type InsertVehicleInventoryMovement = z.infer<typeof insertVehicleInventoryMovementSchema>;
export type VehicleInventoryMovement = typeof vehicleInventoryMovements.$inferSelect;

// Company Settings - for invoice branding
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  gstNumber: text("gst_number"),
  bankDetails: text("bank_details"),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({ id: true });
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;

// Legacy user schema for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
