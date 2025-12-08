import {
  type User,
  type UpsertUser,
  type Vendor,
  type InsertVendor,
  type Customer,
  type InsertCustomer,
  type Vehicle,
  type InsertVehicle,
  type Product,
  type InsertProduct,
  type Purchase,
  type InsertPurchase,
  type PurchaseItem,
  type InsertPurchaseItem,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type StockMovement,
  type InsertStockMovement,
  type VendorPayment,
  type InsertVendorPayment,
  type CustomerPayment,
  type InsertCustomerPayment,
  type CompanySettings,
  type InsertCompanySettings,
  type VehicleInventory,
  type InsertVehicleInventory,
  type VehicleInventoryMovement,
  type InsertVehicleInventoryMovement,
  type VendorReturn,
  type InsertVendorReturn,
  type VendorReturnItem,
  type InsertVendorReturnItem,
  type HalalCashPayment,
  type InsertHalalCashPayment,
  vendors,
  customers,
  vehicles,
  products,
  purchases,
  purchaseItems,
  invoices,
  invoiceItems,
  stockMovements,
  vendorPayments,
  customerPayments,
  companySettings,
  vehicleInventory,
  vehicleInventoryMovements,
  vendorReturns,
  vendorReturnItems,
  halalCashPayments,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;

  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;

  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, quantity: number, type: 'in' | 'out'): Promise<Product | undefined>;

  getPurchases(): Promise<Purchase[]>;
  getPurchase(id: string): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase>;
  getPurchaseItems(purchaseId: string): Promise<PurchaseItem[]>;

  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;

  getStockMovements(startDate?: string, endDate?: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  getVendorPayments(vendorId?: string): Promise<VendorPayment[]>;
  createVendorPayment(payment: InsertVendorPayment): Promise<VendorPayment>;
  getVendorBalance(vendorId: string): Promise<{ totalPurchases: number; totalPayments: number; totalReturns: number; balance: number }>;

  getCustomerPayments(customerId?: string): Promise<CustomerPayment[]>;
  createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment>;
  getCustomerBalance(customerId: string): Promise<{ totalInvoices: number; totalPayments: number; balance: number }>;

  getCompanySettings(): Promise<CompanySettings | undefined>;
  upsertCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;

  // Vehicle Inventory
  getVehicleInventory(vehicleId: string): Promise<VehicleInventory[]>;
  loadVehicleInventory(vehicleId: string, productId: string, quantity: number, purchaseId?: string): Promise<VehicleInventory>;
  deductVehicleInventory(vehicleId: string, productId: string, quantity: number, invoiceId?: string): Promise<VehicleInventory | undefined>;
  getVehicleInventoryMovements(vehicleId: string): Promise<VehicleInventoryMovement[]>;

  // Vendor Returns
  getVendorReturns(vendorId?: string): Promise<VendorReturn[]>;
  getVendorReturn(id: string): Promise<VendorReturn | undefined>;
  createVendorReturn(vendorReturn: InsertVendorReturn, items: InsertVendorReturnItem[]): Promise<VendorReturn>;
  getVendorReturnItems(returnId: string): Promise<VendorReturnItem[]>;

  // Halal Cash Payments
  getHalalCashPayments(): Promise<HalalCashPayment[]>;
  createHalalCashPayment(payment: InsertHalalCashPayment): Promise<HalalCashPayment>;
  deleteHalalCashPayment(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [vendor] = await db.update(vendors).set(updates).where(eq(vendors.id, id)).returning();
    return vendor || undefined;
  }

  async deleteVendor(id: string): Promise<boolean> {
    const result = await db.delete(vendors).where(eq(vendors.id, id)).returning();
    return result.length > 0;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return customer || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(insertVehicle).returning();
    return vehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();
    return vehicle || undefined;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return result.length > 0;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values({
      ...insertProduct,
      currentStock: insertProduct.currentStock ?? 0,
      reorderLevel: insertProduct.reorderLevel ?? 10,
    }).returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async updateProductStock(id: string, quantity: number, type: 'in' | 'out'): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const newStock = type === 'in'
      ? product.currentStock + quantity
      : product.currentStock - quantity;

    const [updated] = await db.update(products)
      .set({ currentStock: Math.max(0, newStock) })
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases);
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase || undefined;
  }

  async createPurchase(insertPurchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> {
    const [purchase] = await db.insert(purchases).values({
      ...insertPurchase,
      status: insertPurchase.status ?? "completed",
    }).returning();

    for (const item of items) {
      await db.insert(purchaseItems).values({
        ...item,
        purchaseId: purchase.id,
      });

      await this.updateProductStock(item.productId, item.quantity, 'in');

      await db.insert(stockMovements).values({
        productId: item.productId,
        type: 'in',
        quantity: item.quantity,
        reason: `Purchase order ${purchase.id.slice(0, 8)}`,
        date: insertPurchase.date,
        referenceId: purchase.id,
      });

      // Load products into vehicle inventory if a vehicle is specified
      if (insertPurchase.vehicleId) {
        await this.loadVehicleInventory(
          insertPurchase.vehicleId,
          item.productId,
          item.quantity,
          purchase.id
        );
      }
    }

    return purchase;
  }

  async getPurchaseItems(purchaseId: string): Promise<PurchaseItem[]> {
    return await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async createInvoice(insertInvoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values({
      ...insertInvoice,
      status: insertInvoice.status ?? "pending",
      halalChargePercent: insertInvoice.halalChargePercent ?? 2,
      halalChargeAmount: insertInvoice.halalChargeAmount ?? 0,
    }).returning();

    for (const item of items) {
      await db.insert(invoiceItems).values({
        ...item,
        invoiceId: invoice.id,
      });

      await this.updateProductStock(item.productId, item.quantity, 'out');

      await db.insert(stockMovements).values({
        productId: item.productId,
        type: 'out',
        quantity: item.quantity,
        reason: `Invoice ${insertInvoice.invoiceNumber}`,
        date: insertInvoice.date,
        referenceId: invoice.id,
      });

      // Deduct from vehicle inventory if a vehicle is specified
      if (insertInvoice.vehicleId) {
        const deductResult = await this.deductVehicleInventory(
          insertInvoice.vehicleId,
          item.productId,
          item.quantity,
          invoice.id
        );
        // Log warning if deduction failed (insufficient stock), but don't block invoice creation
        // as vehicle inventory is a convenience feature, not a hard constraint
        if (!deductResult) {
          console.warn(`Failed to deduct ${item.quantity} of product ${item.productId} from vehicle ${insertInvoice.vehicleId}`);
        }
      }
    }

    return invoice;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async getStockMovements(startDate?: string, endDate?: string): Promise<StockMovement[]> {
    if (startDate && endDate) {
      return await db.select().from(stockMovements)
        .where(and(gte(stockMovements.date, startDate), lte(stockMovements.date, endDate)));
    }
    return await db.select().from(stockMovements);
  }

  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const [movement] = await db.insert(stockMovements).values(insertMovement).returning();
    await this.updateProductStock(insertMovement.productId, insertMovement.quantity, insertMovement.type as 'in' | 'out');
    return movement;
  }

  async getVendorPayments(vendorId?: string): Promise<VendorPayment[]> {
    if (vendorId) {
      return await db.select().from(vendorPayments).where(eq(vendorPayments.vendorId, vendorId));
    }
    return await db.select().from(vendorPayments);
  }

  async createVendorPayment(insertPayment: InsertVendorPayment): Promise<VendorPayment> {
    const [payment] = await db.insert(vendorPayments).values(insertPayment).returning();
    return payment;
  }

  async getVendorBalance(vendorId: string): Promise<{ totalPurchases: number; totalPayments: number; totalReturns: number; balance: number }> {
    const purchaseResult = await db.select({ total: sql<number>`COALESCE(SUM(${purchases.totalAmount}), 0)` })
      .from(purchases)
      .where(eq(purchases.vendorId, vendorId));
    
    const paymentResult = await db.select({ total: sql<number>`COALESCE(SUM(${vendorPayments.amount}), 0)` })
      .from(vendorPayments)
      .where(eq(vendorPayments.vendorId, vendorId));

    const returnResult = await db.select({ total: sql<number>`COALESCE(SUM(${vendorReturns.totalAmount}), 0)` })
      .from(vendorReturns)
      .where(eq(vendorReturns.vendorId, vendorId));

    const totalPurchases = Number(purchaseResult[0]?.total || 0);
    const totalPayments = Number(paymentResult[0]?.total || 0);
    const totalReturns = Number(returnResult[0]?.total || 0);

    return {
      totalPurchases,
      totalPayments,
      totalReturns,
      balance: totalPurchases - totalPayments - totalReturns,
    };
  }

  async getCustomerPayments(customerId?: string): Promise<CustomerPayment[]> {
    if (customerId) {
      return await db.select().from(customerPayments).where(eq(customerPayments.customerId, customerId));
    }
    return await db.select().from(customerPayments);
  }

  async createCustomerPayment(insertPayment: InsertCustomerPayment): Promise<CustomerPayment> {
    const [payment] = await db.insert(customerPayments).values(insertPayment).returning();
    return payment;
  }

  async getCustomerBalance(customerId: string): Promise<{ totalInvoices: number; totalPayments: number; balance: number }> {
    const invoiceResult = await db.select({ total: sql<number>`COALESCE(SUM(${invoices.grandTotal}), 0)` })
      .from(invoices)
      .where(eq(invoices.customerId, customerId));
    
    const paymentResult = await db.select({ total: sql<number>`COALESCE(SUM(${customerPayments.amount}), 0)` })
      .from(customerPayments)
      .where(eq(customerPayments.customerId, customerId));

    const totalInvoices = Number(invoiceResult[0]?.total || 0);
    const totalPayments = Number(paymentResult[0]?.total || 0);

    return {
      totalInvoices,
      totalPayments,
      balance: totalInvoices - totalPayments,
    };
  }

  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings || undefined;
  }

  async upsertCompanySettings(insertSettings: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings();
    if (existing) {
      const [updated] = await db.update(companySettings).set(insertSettings).where(eq(companySettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(companySettings).values(insertSettings).returning();
    return created;
  }

  // Vehicle Inventory Methods
  async getVehicleInventory(vehicleId: string): Promise<VehicleInventory[]> {
    return await db.select().from(vehicleInventory).where(eq(vehicleInventory.vehicleId, vehicleId));
  }

  async getVehicleProductInventory(vehicleId: string, productId: string): Promise<VehicleInventory | undefined> {
    // Get total quantity for this vehicle+product combination (aggregate all matching rows)
    const records = await db.select().from(vehicleInventory)
      .where(and(eq(vehicleInventory.vehicleId, vehicleId), eq(vehicleInventory.productId, productId)));
    
    if (records.length === 0) return undefined;
    
    // Return first record - we'll ensure only one exists via upsert logic
    return records[0];
  }

  async loadVehicleInventory(vehicleId: string, productId: string, quantity: number, purchaseId?: string): Promise<VehicleInventory> {
    // Check if inventory record exists for this vehicle+product
    const [existing] = await db.select().from(vehicleInventory)
      .where(and(eq(vehicleInventory.vehicleId, vehicleId), eq(vehicleInventory.productId, productId)));

    let inventoryRecord: VehicleInventory;
    
    if (existing) {
      // Update existing inventory (upsert pattern)
      const [updated] = await db.update(vehicleInventory)
        .set({ quantity: existing.quantity + quantity })
        .where(and(eq(vehicleInventory.vehicleId, vehicleId), eq(vehicleInventory.productId, productId)))
        .returning();
      inventoryRecord = updated;
    } else {
      // Create new inventory record
      const [created] = await db.insert(vehicleInventory)
        .values({ vehicleId, productId, quantity })
        .returning();
      inventoryRecord = created;
    }

    // Log the movement
    const today = new Date().toISOString().split("T")[0];
    await db.insert(vehicleInventoryMovements).values({
      vehicleId,
      productId,
      type: 'load',
      quantity,
      referenceId: purchaseId,
      referenceType: purchaseId ? 'purchase' : undefined,
      date: today,
    });

    return inventoryRecord;
  }

  async deductVehicleInventory(vehicleId: string, productId: string, quantity: number, invoiceId?: string): Promise<VehicleInventory | undefined> {
    // Find existing inventory
    const [existing] = await db.select().from(vehicleInventory)
      .where(and(eq(vehicleInventory.vehicleId, vehicleId), eq(vehicleInventory.productId, productId)));

    // Guard against insufficient stock - return undefined if not enough
    if (!existing) {
      console.warn(`Vehicle ${vehicleId} has no inventory for product ${productId}`);
      return undefined;
    }
    
    if (existing.quantity < quantity) {
      console.warn(`Insufficient stock: Vehicle ${vehicleId} has ${existing.quantity} but requested ${quantity}`);
      return undefined;
    }

    const newQuantity = Math.max(0, existing.quantity - quantity);
    
    const [updated] = await db.update(vehicleInventory)
      .set({ quantity: newQuantity })
      .where(and(eq(vehicleInventory.vehicleId, vehicleId), eq(vehicleInventory.productId, productId)))
      .returning();

    // Log the movement
    const today = new Date().toISOString().split("T")[0];
    await db.insert(vehicleInventoryMovements).values({
      vehicleId,
      productId,
      type: 'sale',
      quantity,
      referenceId: invoiceId,
      referenceType: invoiceId ? 'invoice' : undefined,
      date: today,
    });

    return updated;
  }

  async getVehicleInventoryMovements(vehicleId: string): Promise<VehicleInventoryMovement[]> {
    return await db.select().from(vehicleInventoryMovements).where(eq(vehicleInventoryMovements.vehicleId, vehicleId));
  }

  // Vendor Returns Methods
  async getVendorReturns(vendorId?: string): Promise<VendorReturn[]> {
    if (vendorId) {
      return await db.select().from(vendorReturns).where(eq(vendorReturns.vendorId, vendorId));
    }
    return await db.select().from(vendorReturns);
  }

  async getVendorReturn(id: string): Promise<VendorReturn | undefined> {
    const [vendorReturn] = await db.select().from(vendorReturns).where(eq(vendorReturns.id, id));
    return vendorReturn || undefined;
  }

  async createVendorReturn(insertVendorReturn: InsertVendorReturn, items: InsertVendorReturnItem[]): Promise<VendorReturn> {
    const [vendorReturn] = await db.insert(vendorReturns).values({
      ...insertVendorReturn,
      status: insertVendorReturn.status ?? "completed",
    }).returning();

    for (const item of items) {
      await db.insert(vendorReturnItems).values({
        ...item,
        returnId: vendorReturn.id,
      });

      // Deduct stock when returning to vendor (stock goes out)
      await this.updateProductStock(item.productId, item.quantity, 'out');

      // Record stock movement
      await db.insert(stockMovements).values({
        productId: item.productId,
        type: 'out',
        quantity: item.quantity,
        reason: `Vendor return: ${item.reason}`,
        date: insertVendorReturn.date,
        referenceId: vendorReturn.id,
      });

      // If vehicle is specified, also deduct from vehicle inventory
      if (insertVendorReturn.vehicleId) {
        await this.deductVehicleInventory(
          insertVendorReturn.vehicleId,
          item.productId,
          item.quantity,
          vendorReturn.id
        );
      }
    }

    return vendorReturn;
  }

  async getVendorReturnItems(returnId: string): Promise<VendorReturnItem[]> {
    return await db.select().from(vendorReturnItems).where(eq(vendorReturnItems.returnId, returnId));
  }

  // Halal Cash Payments
  async getHalalCashPayments(): Promise<HalalCashPayment[]> {
    return await db.select().from(halalCashPayments);
  }

  async createHalalCashPayment(insertPayment: InsertHalalCashPayment): Promise<HalalCashPayment> {
    const [payment] = await db.insert(halalCashPayments).values(insertPayment).returning();
    return payment;
  }

  async deleteHalalCashPayment(id: string): Promise<boolean> {
    const result = await db.delete(halalCashPayments).where(eq(halalCashPayments.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
