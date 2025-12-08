# VegWholesale - Vegetable Wholesale Business Manager

## Overview
A comprehensive business management system for vegetable wholesale operations. The application helps manage the entire workflow from buying vegetables from vendors/farmers to selling to customers.

## Current State
Full-featured application with complete business workflow:
- Vendor management with payment tracking
- Customer management with receivables tracking
- Vehicle tracking
- Product catalog
- Stock management with movement history
- Purchase orders
- Vendor returns for defective products
- Invoice/billing with Hamali charge option
- Payment tracking (vendor & customer)
- Business reports (profit/loss, stock movements)
- Print center for invoices and delivery challans
- Company settings for branding

## Technology Stack
- **Frontend**: React with TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query)

## Project Structure
```
client/
  src/
    components/       # Reusable components
      app-sidebar.tsx # Navigation sidebar
      theme-toggle.tsx # Dark/light mode toggle
      ui/             # Shadcn UI components
    pages/            # Page components
      dashboard.tsx   # Overview with metrics
      vendors.tsx     # Vendor CRUD
      customers.tsx   # Customer CRUD
      vehicles.tsx    # Vehicle CRUD
      products.tsx    # Product catalog
      stock.tsx       # Stock management
      purchases.tsx   # Purchase orders
      billing.tsx     # Customer invoices
      payments.tsx    # Vendor/customer payments
      reports.tsx     # Business reports
      print.tsx       # Print center
      settings.tsx    # Company settings
    App.tsx           # Main app with routing
server/
  routes.ts           # API endpoints
  storage.ts          # Database storage layer
  db.ts               # Database connection
shared/
  schema.ts           # Data models and types (Drizzle schema)
```

## Key Features

### Vendor Management
- Add/edit/delete vendors
- Track name, phone, email, address
- View outstanding balances

### Customer Management
- Add/edit/delete customers
- Track contact information
- View receivable balances

### Vehicle Tracking
- Register vehicles for stock receiving
- Track vehicle number, type, capacity, driver details

### Product Catalog
- Manage vegetable products
- Set purchase and sale prices
- Track units (KG, Dozen, Piece, etc.)
- Reorder level alerts

### Stock Management
- Real-time inventory tracking
- Add/reduce stock with reasons
- Stock movement history with date filtering
- Low stock alerts
- Separate "Returned" column showing vendor return quantities

### Purchase Orders
- Create purchases from vendors
- Assign vehicles
- Add multiple line items
- Auto-update stock on creation

### Vendor Returns
- Return defective or damaged products to vendors
- Track return reason per item (Damaged, Rotten/Spoiled, Wrong Item, Quality Issue, Excess Stock, Other)
- Optional vehicle assignment for truck-based returns
- Auto-deduct stock when return is created
- Credits vendor balance (reduces payable amount)
- Return history with filtering

### Weighing Station
- Select truck/vehicle and customer
- Multi-unit support:
  - Weight-based products (KG): Use scale capture or manual entry
  - Count-based products (Box, Bag, Crate, Piece, Dozen, Bundle): Manual quantity with +/- buttons
- Auto-detect product unit and show appropriate input method
- Vehicle inventory display with available quantities
- Quick invoice generation from weighing
- Hamali charge toggle with percentage

### Billing/Invoicing
- Create customer invoices
- Hamali charge toggle (include/exclude)
- Configurable Hamali charge percentage
- Auto-calculate totals
- Stock deduction on invoice creation

### Payment Tracking
- Record vendor payments (cash, bank, UPI, cheque)
- Record customer payments
- Track outstanding balances
- Payment history for audit

### Reports
- **Date Range Filtering**: Filter all reports by from/to date
- **View By Options**:
  - All Data: Shows complete data for date range
  - Day-wise: Aggregated daily summary with sales, invoices, Hamali breakdown
  - Monthly: Aggregated monthly summary
- **Download CSV**: Each report section has download button
  - Daily report CSV
  - Monthly report CSV
  - Invoice details CSV
  - Hamali cash payments CSV
  - Stock movements CSV
- **Summary Cards**:
  - Total Sales for filtered period
  - Hamali from Invoices with count
  - Hamali Direct Cash with count
  - Total Hamali Collected
- **Invoice Details Tab**:
  - Each invoice with Hamali status badge (Included/Excluded)
  - Hamali percentage and amount per invoice
  - Subtotal and grand total breakdown
- **Hamali Cash Payments Tab**:
  - All direct cash payments with date, amount, method
  - Customer association if any
  - Running total
- **Profit Margins Tab**: Product-wise margin analysis
- **Stock Movements Tab**: In/out movements with reason
- **Low Stock Alerts Tab**: Products below reorder level

### Print Center
- Generate tax invoices
- Generate delivery challans
- Company branding on documents
- Print-ready format

### Settings
- Company name and contact info
- GST number
- Bank details for invoices

## API Endpoints

### Vendors
- GET /api/vendors
- GET /api/vendors/:id
- GET /api/vendors/:id/balance
- POST /api/vendors
- PATCH /api/vendors/:id
- DELETE /api/vendors/:id

### Customers
- GET /api/customers
- GET /api/customers/:id
- GET /api/customers/:id/balance
- POST /api/customers
- PATCH /api/customers/:id
- DELETE /api/customers/:id

### Vehicles
- GET /api/vehicles
- GET /api/vehicles/:id
- POST /api/vehicles
- PATCH /api/vehicles/:id
- DELETE /api/vehicles/:id

### Products
- GET /api/products
- GET /api/products/:id
- POST /api/products
- PATCH /api/products/:id
- DELETE /api/products/:id

### Stock Movements
- GET /api/stock-movements
- POST /api/stock-movements

### Purchases
- GET /api/purchases
- GET /api/purchases/:id
- GET /api/purchases/:id/items
- POST /api/purchases

### Vendor Returns
- GET /api/vendor-returns
- GET /api/vendor-returns/:id
- GET /api/vendor-returns/:id/items
- POST /api/vendor-returns

### Invoices
- GET /api/invoices
- GET /api/invoices/:id
- GET /api/invoices/:id/items
- POST /api/invoices

### Payments
- GET /api/vendor-payments
- POST /api/vendor-payments
- GET /api/customer-payments
- POST /api/customer-payments

### Hamali Cash Payments
- GET /api/hamali-cash
- POST /api/hamali-cash
- DELETE /api/hamali-cash/:id

### Reports
- GET /api/reports/profit-loss
- GET /api/reports/vendor-balances
- GET /api/reports/customer-balances

### Settings
- GET /api/company-settings
- POST /api/company-settings

## Database Schema (PostgreSQL)
- users - User accounts (Replit Auth)
- sessions - User session storage
- vendors - Vendor information
- customers - Customer information
- vehicles - Vehicle tracking
- products - Product catalog with pricing
- stock_movements - Stock in/out history
- purchases - Purchase order headers
- purchase_items - Purchase line items
- vendor_returns - Vendor return headers
- vendor_return_items - Vendor return line items
- invoices - Invoice headers
- invoice_items - Invoice line items
- vendor_payments - Vendor payment records
- customer_payments - Customer payment records
- hamali_cash_payments - Direct Hamali cash payments
- company_settings - Company configuration
- vehicle_inventory - Per-vehicle product quantities
- vehicle_inventory_movements - Vehicle stock load/sale history

## Design System
- Font: IBM Plex Sans (primary), IBM Plex Mono (numbers)
- Color scheme: Green primary color (142 hue) for vegetable/organic theme
- Supports dark/light mode toggle
- Follows Carbon Design System principles for enterprise apps

## User Preferences
- Currency: Indian Rupees (₹)
- Date format: YYYY-MM-DD
- Business focused, minimal UI

## Recent Changes
- December 8, 2025: Added vendor returns feature
  - Return defective products to vendors with reason tracking
  - Automatically deducts stock and credits vendor balance
  - Full return history with vendor/vehicle/amount tracking
- December 8, 2025: Added vehicle inventory tracking system
  - Products loaded into vehicles via purchases are tracked separately
  - Weighing station displays remaining stock per vehicle
  - Invoice creation automatically deducts from vehicle inventory
  - Movement history tracks all loading and selling activity
- December 8, 2025: Added payments, reports, print center, and settings pages
- December 8, 2025: Migrated from in-memory storage to PostgreSQL database
- December 8, 2025: Initial MVP release with all core features
