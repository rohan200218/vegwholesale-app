# VegWholesale - Vegetable Wholesale Business Manager

## Overview
A comprehensive business management system for vegetable wholesale operations. The application helps manage the entire workflow from buying vegetables from vendors/farmers to selling to customers.

## Current State
MVP complete with all core features implemented:
- Vendor management
- Customer management  
- Vehicle tracking
- Product catalog
- Stock management
- Purchase orders
- Invoice/billing with Halal charge option

## Technology Stack
- **Frontend**: React with TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Storage**: In-memory storage (MemStorage)
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
    App.tsx           # Main app with routing
server/
  routes.ts           # API endpoints
  storage.ts          # Data storage layer
shared/
  schema.ts           # Data models and types
```

## Key Features

### Vendor Management
- Add/edit/delete vendors
- Track name, phone, email, address

### Customer Management
- Add/edit/delete customers
- Track contact information

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
- Stock movement history
- Low stock alerts

### Purchase Orders
- Create purchases from vendors
- Assign vehicles
- Add multiple line items
- Auto-update stock on creation

### Billing/Invoicing
- Create customer invoices
- Halal charge toggle (include/exclude)
- Configurable Halal charge percentage
- Auto-calculate totals
- Stock deduction on invoice creation

## API Endpoints

### Vendors
- GET /api/vendors
- GET /api/vendors/:id
- POST /api/vendors
- PATCH /api/vendors/:id
- DELETE /api/vendors/:id

### Customers
- GET /api/customers
- GET /api/customers/:id
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

### Invoices
- GET /api/invoices
- GET /api/invoices/:id
- GET /api/invoices/:id/items
- POST /api/invoices

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
- December 8, 2025: Initial MVP release with all core features
