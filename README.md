# FiTrack — Production-Ready Personal Finance Tracker

FiTrack is a full-stack personal finance tracking application with an Angular 21 frontend and a Node.js/Express REST API backend powered by SQLite.

---

## Project Structure

```
FiTrack/
├── fitrack/              # Angular 21 frontend
│   └── src/app/
│       ├── components/   # Login, Register, Layout, Sidebar, Dashboard,
│       │                 # Transactions, Budgets, Analytics, Import, Profile
│       ├── services/     # auth, transaction, budget, analytics, import, profile
│       ├── models/       # TypeScript interfaces for all entities
│       ├── guards/       # authGuard
│       └── interceptors/ # JWT auth interceptor
└── fitrack-server/       # Node.js/Express backend
    ├── controllers/      # auth, transaction, budget, profile, import, analytics
    ├── routes/           # REST route definitions
    ├── models/           # Sequelize models: User, Transaction, Budget
    ├── middleware/        # JWT authentication middleware
    └── config/           # SQLite database config
```

---

## Features

| Feature | Details |
|---|---|
| **Authentication** | Register, Login, JWT tokens, route guards |
| **Transactions** | Full CRUD with filters (type, category, date range) |
| **Budgets** | Per-category spending limits with live progress bars |
| **Analytics** | 12-month trend chart, category doughnut charts, savings rate |
| **Import** | CSV (PhonePe/Google Pay), XLSX, PDF with auto-format detection and category mapping |
| **Profile** | Display name, base currency, timezone, password change |

---

## Quick Start

### Backend
```bash
cd fitrack-server
npm install
# Set up .env (see fitrack-server/README.md)
npm start
```

### Frontend
```bash
cd fitrack
npm install
npm start
```

Open `http://localhost:4200` to access the application.

---

## Architecture & Production Adaptations

To make the codebase robust for production environments, the following technical integrations were made:
- **CJS/ESM Module Interoperability**: Resolved native import wrapper problems using Node's `createRequire` and dynamic imports for `pdf-parse` (v2.4.5) ES Module environments.
- **Robust PDF Ingestion**: Upgraded the PDF parsing engine to statefully scan statement layouts. Implemented a self-healing date parser (supporting formats like `Jan 10, 2025` and `09 Dec, 2025`) and a generic transaction line matcher (matching Date, Narration, Type, and Amount) that dynamically filters out statement header/summary metadata. Supports statements from major platforms (PhonePe, GPay, Jio Payments Bank, BHIM, etc.).
- **Robust Excel Ingestion**: Implemented a column-by-column `row.eachCell` loop using `ExcelJS` that tracks headers dynamically. Incorporates a resolver for Formula Cells to fetch target calculation results instead of returning standard object representations.
- **Global Error Middleware**: Added a fallback error-catching middleware in Express to map Multer file size boundaries, file filter rejections, and SQL constraints into a standardized JSON response layout, preventing HTML leaks to the Angular client.
- **Tailwind CSS v4 & Angular 21 Integrations**: Sidebar layout uses dynamic Tailwind transitions toggled by signals, dynamically recalculating margins and layout alignment for collapsed and expanded views.
- **Chart.js Provider Registering**: Added the global charts provider to the Angular root bootstrap config `app.config.ts` to cleanly initialize charting canvas dependencies.

## Tech Stack
- **Frontend**: Angular 21 (Standalone, Signals, Zoneless), Tailwind CSS v4, ng2-charts / Chart.js
- **Backend**: Node.js ES Modules, Express.js, Sequelize ORM, SQLite, multer, csv-parser, exceljs, pdf-parse
- **Auth**: bcryptjs password hashing, JSON Web Tokens (JWT)


