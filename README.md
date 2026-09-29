# PG Management System (Hostel & Co-Living SaaS)

A modern, production-ready full-stack SaaS web application designed for PG (Paying Guest), Hostel, and Co-Living operators to manage multiple properties, floors, rooms, beds, tenants, automatic rent billing, payments, expenses, complaints, visitors, documents, staff, and daily operations from a single centralized dashboard.

---

## 🌟 Key Features

### 1. Multi-Property Centralized Management
* Switch seamlessly between multiple PG buildings/branches from the global header.
* Property-specific stats, floors, rooms, beds, staff, and financial reconciliation.
* Consolidated "All Properties" mode for portfolio-wide KPI visibility.

### 2. Visual Room & Bed Occupancy Matrix
* Color-coded live occupancy status:
  * 🟢 **Green**: Available
  * 🔴 **Red**: Occupied (with resident name & details)
  * 🟡 **Yellow**: Reserved
  * ⚫ **Slate**: Under Maintenance
* Hierarchical structure: **Property ➔ Floor ➔ Room ➔ Bed ➔ Tenant**.
* Prevents overbooking: system guarantees one bed cannot have more than one active tenant.

### 3. Tenant Onboarding & Checkout Workflows
* **5-Step Onboarding Flow**:
  1. Personal Information & Emergency Contacts
  2. KYC Identification (Aadhaar, PAN, Passport, Driving License)
  3. Room & Bed Allocation (dynamic availability filtering)
  4. Contract Terms, Security Deposit, Advance Rent & Notice Period
  5. Summary Confirmation & Bed Locking
* **Automated Check-Out Settlement**:
  * Calculates refundable security deposit minus pending rent, utility dues, and damage charges.
  * Releases bed status back to `AVAILABLE`.
  * Logs checkout history and archives agreement.

### 4. Rent Billing & Invoicing Engine
* Configurable rent due dates, grace periods, and late fee policies.
* **Bulk Invoice Generation**: 1-click billing for all active tenants of a property for any given month.
* Printable & downloadable formatted invoices with itemized charges.
* Partial and full payment tracking.

### 5. Payment Collections & Receipts
* Supports UPI, Cash, Bank Transfer, and Card payments.
* Automatically balances invoices upon receipt.
* Instant printable payment acknowledgement receipts with unique serial numbers.

### 6. Expense & Utility Management
* Categorized expenditures (Electricity, Water, Internet, Ration, Salaries, Maintenance, Cleaning).
* Real-time calculation: **Revenue - Expenses = Net Operating Income**.
* Electricity meter readings logger with automatic units consumed and bill calculations.

### 7. Complaints & Maintenance Ticketing
* Categorized requests (Plumbing, Wi-Fi, Electrical, Food, Cleaning).
* Priority levels: Low, Medium, High, Urgent.
* Assignment to maintenance staff, status tracking (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), and resolution notes.

### 8. Visitor Gatepass System
* Log visiting guests with contact details, purpose, and resident mapping.
* Live tracker of guests currently inside premises with 1-click "Check Out".

### 9. Dedicated Tenant Portal
* Separate login experience for residents (`/portal`):
  * Room & Bed details.
  * Current rent dues with instant "Pay Now" simulation.
  * Downloadable payment receipts.
  * Maintenance request filing and status tracker.
  * Hostel notices and lease agreement terms.
* Complete data isolation: tenants can never access other tenants' private data.

### 10. Business Reports & CSV Export
* Rent Collection Report, Pending Dues Report, Occupancy Report, Profit & Loss (P&L) Report, and Expense Breakdown.
* Date range filtering and **1-click CSV file download**.

### 11. Security & RBAC
* Role-based access control with 6 roles: `SUPER_ADMIN`, `OWNER`, `MANAGER`, `ACCOUNTANT`, `STAFF`, `TENANT`.
* Bcrypt password hashing & JWT session cookies.
* Complete system audit log (`ActivityLog`) recording all actions.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Recharts.
* **Backend**: Next.js API Routes / Server Architecture, TypeScript.
* **Database & ORM**: PostgreSQL 16, Prisma ORM.
* **Authentication**: Bcrypt.js, Jose (JWT), Secure HTTP-only cookies.
* **Validation**: Zod schema validation.
* **Testing**: Vitest test suite covering RBAC, bed locking, checkout release, and rent math.

---

## 🚀 Getting Started

### Prerequisites
* Node.js >= 18.x
* PostgreSQL (Local PostgreSQL, Neon, Supabase, or Railway)

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is set:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pg_management?schema=public"
JWT_SECRET="super-secure-pg-management-jwt-secret-key-2026-production-ready"
NEXT_PUBLIC_APP_NAME="PG Management System"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./public/uploads"
```

### 3. Database Synchronization & Seed
Run Prisma to push the schema to PostgreSQL and seed initial demo data:
```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed sample properties, rooms, beds, tenants, and bills
npm run seed
```

### 4. Running the Application
```bash
# Start development server
npm run dev

# Or build and start for production
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo User Accounts

All demo accounts are pre-configured with the password: **`password123`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Owner** | `owner@pgmanagement.com` | Full property portfolio, financial control, settings & staff |
| **Manager** | `manager@pgmanagement.com` | Tenant onboarding, rooms, beds, complaints, visitors |
| **Accountant** | `accountant@pgmanagement.com` | Rent generation, payments, invoices, expenses, reports |
| **Staff** | `staff@pgmanagement.com` | Daily operational tickets, complaints resolution, visitors |
| **Tenant** | `tenant@pgmanagement.com` | Dedicated resident portal: dues, receipts, tickets, notices |
| **Super Admin** | `admin@pgmanagement.com` | System-wide administrative privileges |

*(Note: The login screen also features 1-click quick login buttons for all roles)*

---

## 🧪 Running Automated Tests

Run the Vitest test suite to verify business rules, bed locking, checkout releases, and RBAC:
```bash
npm test
```

---

## 📁 Directory Structure

```
├── app/
│   ├── api/                 # 27 RESTful endpoints (Auth, Properties, Rooms, Tenants, Bills, etc.)
│   ├── complaints/          # Maintenance & support ticketing
│   ├── dashboard/           # Main KPI metrics & Recharts analytics
│   ├── documents/           # KYC & identity verification vault
│   ├── expenses/            # Operational spending & voucher logger
│   ├── login/               # Split-screen SaaS authentication
│   ├── notices/             # Hostel announcement board
│   ├── payments/            # Transaction log & printable receipts
│   ├── portal/              # Dedicated resident tenant dashboard
│   ├── properties/          # Multi-property CRUD & tabbed details
│   ├── rent/                # Monthly rent invoicing & bulk generator
│   ├── reports/             # P&L, collections, occupancy & CSV export
│   ├── rooms/               # Visual Room & Bed Occupancy Matrix
│   ├── settings/            # Billing rules, late fees & audit logs
│   ├── staff/               # Employee directory & roles
│   ├── tenants/             # Resident registry, profiles & checkout
│   ├── utilities/           # Electricity meter reading tracker
│   └── visitors/            # Visitor gatepass log
├── components/
│   ├── layout/              # Sidebar, Header, Shell, Global Search
│   └── ui/                  # Reusable UI primitives (Button, Card, Modal, Input, Tabs)
├── lib/
│   ├── auth.ts              # Bcrypt hashing, JWT sessions & cookies
│   ├── permissions.ts       # Server-side RBAC matrix
│   ├── prisma.ts            # Prisma client singleton
│   ├── validation.ts        # Zod validation schemas
│   └── services/            # Business transactions (Tenant, Rent, Dashboard)
├── prisma/
│   ├── schema.prisma        # Normalized relational schema (22 models)
│   └── seed.ts              # Realistic database seeder
└── tests/                   # Automated Vitest integration test suite
```

---

## 🌐 Production Deployment

### Vercel / Railway / Docker
1. Set the environment variables (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`) in your platform settings.
2. Build command: `npm run build`
3. Start command: `npm start`
4. Post-deploy hook: `npx prisma db push && npm run seed`

---

## 📄 License
MIT License. Built for commercial and enterprise hostel management.
