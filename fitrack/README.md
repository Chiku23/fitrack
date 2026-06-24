# FiTrack — Angular Frontend

Angular 21 standalone application for the FiTrack personal finance tracker.

## Tech Stack
- **Angular 21** — Standalone components, Signals, Zoneless change detection
- **Tailwind CSS v4** — Utility-first styling
- **ng2-charts + Chart.js** — Data visualization
- **Reactive Forms** — Form management with validation
- **JWT Auth Interceptor** — Automatic token attachment on every request

## Pages

| Route | Component | Description |
|---|---|---|
| `/login` | `LoginComponent` | Sign in with email/password |
| `/register` | `RegisterComponent` | Create new account |
| `/dashboard` | `DashboardComponent` | KPI cards + 6-month bar chart + recent transactions |
| `/transactions` | `TransactionsComponent` | Full CRUD table with filters and modals |
| `/budgets` | `BudgetsComponent` | Budget goals with progress bars |
| `/analytics` | `AnalyticsComponent` | Line trend chart + category doughnut charts |
| `/import` | `ImportComponent` | Drag-and-drop file import (CSV/XLSX/PDF) |
| `/profile` | `ProfileComponent` | Account settings and password change |

## Services

| Service | File | Endpoints |
|---|---|---|
| AuthService | `services/auth.ts` | `/api/auth/login`, `/api/auth/register` |
| TransactionService | `services/transaction.ts` | `/api/transactions` (CRUD + filters) |
| BudgetService | `services/budget.ts` | `/api/budgets` (CRUD) |
| AnalyticsService | `services/analytics.ts` | `/api/analytics/summary`, `/api/analytics/monthly-trend` |
| ImportService | `services/import.ts` | `/api/import/csv`, `/api/import/excel`, `/api/import/pdf` |
| ProfileService | `services/profile.ts` | `/api/profile` (GET/PUT + password) |

## Getting Started

```bash
npm install
npm install ng2-charts chart.js
npm start
```
Runs at `http://localhost:4200`

Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

## Features & UI Adaptations
- **Zoneless Signal State**: Leverages Angular 21 Signals for responsive reactive state management across all CRUD operations, profile values, and the sidebar layout.
- **Dynamic Sidebar**: A responsive, collapsible sidebar toggled via a header hamburger control. Integrates Tailwind CSS v4 class transitions to adjust page content layouts smoothly.
- **Chart.js Provider**: Programmatically imports Chart.js elements within `app.config.ts` via `provideCharts` to render interactive transaction history trends and category breakdowns without global window declarations.
- **Flexible File Upload**: Features an ingestion form that supports Drag-and-Drop file processing for CSV, Excel (`.xlsx`), and PDF statement files. Includes error notifications that highlight unmatched statement fields or format errors.
