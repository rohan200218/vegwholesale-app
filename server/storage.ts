import {
  type User,
  type InsertUser,
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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vendors
  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, quantity: number, type: 'in' | 'out'): Promise<Product | undefined>;

  // Purchases
  getPurchases(): Promise<Purchase[]>;
  getPurchase(id: string): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase>;
  getPurchaseItems(purchaseId: string): Promise<PurchaseItem[]>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;

  // Stock Movements
  getStockMovements(): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vendors: Map<string, Vendor>;
  private customers: Map<string, Customer>;
  private vehicles: Map<string, Vehicle>;
  private products: Map<string, Product>;
  private purchases: Map<string, Purchase>;
  private purchaseItems: Map<string, PurchaseItem>;
  private invoices: Map<string, Invoice>;
  private invoiceItems: Map<string, InvoiceItem>;
  private stockMovements: Map<string, StockMovement>;

  constructor() {
    this.users = new Map();
    this.vendors = new Map();
    this.customers = new Map();
    this.vehicles = new Map();
    this.products = new Map();
    this.purchases = new Map();
    this.purchaseItems = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.stockMovements = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = randomUUID();
    const vendor: Vendor = { ...insertVendor, id };
    this.vendors.set(id, vendor);
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const vendor = this.vendors.get(id);
    if (!vendor) return undefined;
    const updated = { ...vendor, ...updates };
    this.vendors.set(id, updated);
    return updated;
  }

  async deleteVendor(id: string): Promise<boolean> {
    return this.vendors.delete(id);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    const updated = { ...customer, ...updates };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const vehicle: Vehicle = { ...insertVehicle, id };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    const updated = { ...vehicle, ...updates };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      currentStock: insertProduct.currentStock ?? 0,
      reorderLevel: insertProduct.reorderLevel ?? 10,
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async updateProductStock(id: string, quantity: number, type: 'in' | 'out'): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const newStock = type === 'in' 
      ? product.currentStock + quantity 
      : product.currentStock - quantity;
    
    const updated = { ...product, currentStock: Math.max(0, newStock) };
    this.products.set(id, updated);
    return updated;
  }

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values());
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    return this.purchases.get(id);
  }

  async createPurchase(insertPurchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<Purchase> {
    const id = randomUUID();
    const purchase: Purchase = { 
      ...insertPurchase, 
      id,
      status: insertPurchase.status ?? "completed",
    };
    this.purchases.set(id, purchase);

    // Create purchase items and update stock
    for (const item of items) {
      const itemId = randomUUID();
      const purchaseItem: PurchaseItem = { ...item, id: itemId, purchaseId: id };
      this.purchaseItems.set(itemId, purchaseItem);

      // Update product stock
      await this.updateProductStock(item.productId, item.quantity, 'in');

      // Create stock movement
      const movementId = randomUUID();
      const movement: StockMovement = {
        id: movementId,
        productId: item.productId,
        type: 'in',
        quantity: item.quantity,
        reason: `Purchase order ${id.slice(0, 8)}`,
        date: insertPurchase.date,
        referenceId: id,
      };
      this.stockMovements.set(movementId, movement);
    }

    return purchase;
  }

  async getPurchaseItems(purchaseId: string): Promise<PurchaseItem[]> {
    return Array.from(this.purchaseItems.values()).filter(
      (item) => item.purchaseId === purchaseId
    );
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = { 
      ...insertInvoice, 
      id,
      status: insertInvoice.status ?? "pending",
      halalChargePercent: insertInvoice.halalChargePercent ?? 2,
      halalChargeAmount: insertInvoice.halalChargeAmount ?? 0,
    };
    this.invoices.set(id, invoice);

    // Create invoice items and update stock
    for (const item of items) {
      const itemId = randomUUID();
      const invoiceItem: InvoiceItem = { ...item, id: itemId, invoiceId: id };
      this.invoiceItems.set(itemId, invoiceItem);

      // Update product stock
      await this.updateProductStock(item.productId, item.quantity, 'out');

      // Create stock movement
      const movementId = randomUUID();
      const movement: StockMovement = {
        id: movementId,
        productId: item.productId,
        type: 'out',
        quantity: item.quantity,
        reason: `Invoice ${insertInvoice.invoiceNumber}`,
        date: insertInvoice.date,
        referenceId: id,
      };
      this.stockMovements.set(movementId, movement);
    }

    return invoice;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(
      (item) => item.invoiceId === invoiceId
    );
  }

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    return Array.from(this.stockMovements.values());
  }

  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const id = randomUUID();
    const movement: StockMovement = { ...insertMovement, id };
    this.stockMovements.set(id, movement);

    // Update product stock
    await this.updateProductStock(
      insertMovement.productId, 
      insertMovement.quantity, 
      insertMovement.type as 'in' | 'out'
    );

    return movement;
  }
}

export const storage = new MemStorage();
