# TransitOps - Smart Transport Operations Platform

TransitOps is a demo-ready transport operations platform for logistics teams. It replaces manual spreadsheets with a single command center for fleet registry, driver compliance, trip dispatch, maintenance, fuel, expenses, analytics, reports, notifications, and audit activity.

## Problem Statement

Logistics operators need to prevent vehicle conflicts, driver conflicts, expired-license dispatches, unavailable-vehicle assignments, missed maintenance, poor fuel tracking, and inaccurate cost visibility. TransitOps centralizes those workflows with server-side validation and transactional state changes.

## Features

- Email/password authentication with role-based access control.
- Roles: `ADMIN`, `FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`.
- Professional responsive SaaS shell with sidebar, topbar, quick create, global search, notifications, and dark mode.
- Vehicle registry with search, filters, pagination, lifecycle statuses, details, cost, ROI, fuel, maintenance, and trip history.
- Driver registry with compliance indicators, safety score, current trip, and trip history.
- Multi-step trip creation with eligible vehicle and driver filtering.
- Transactional trip dispatch, completion, and cancellation.
- Transactional active maintenance and maintenance closure.
- Fuel logs and expense tracking.
- Dashboard KPIs and charts from database data.
- Analytics charts for efficiency, costs, revenue, ROI, maintenance, fuel, and trip completion trends.
- CSV reports for fleet, vehicles, drivers, trips, maintenance, fuel, expenses, and ROI.
- Activity log and notification center.
- Critical business-rule tests.

## Technology Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Prisma ORM
- SQLite for local hackathon reliability
- NextAuth credentials authentication
- Zod validation
- Recharts
- Lucide icons
- Sonner toasts
- Vitest

The Prisma schema is migration-friendly. SQLite is used here so judges can run the demo locally without PostgreSQL setup. A PostgreSQL migration would primarily convert app-level enum strings to database enums and update `DATABASE_URL`.

## Getting Started

```bash
npm install
npm run db:init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env` if needed.

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Demo Accounts

All demo accounts use this password:

```text
TransitOps@123
```

| Role | Email |
| --- | --- |
| Admin | `admin@transitops.local` |
| Fleet Manager | `fleet@transitops.local` |
| Dispatcher | `dispatcher@transitops.local` |
| Safety Officer | `safety@transitops.local` |
| Financial Analyst | `finance@transitops.local` |

## Development Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

## Database Commands

```bash
npm run db:init
npm run db:seed
npm run db:generate
```

`db:init` applies the SQL migration at `prisma/migrations/000001_init/migration.sql`. This project keeps that explicit SQL initializer because the local Windows Prisma schema engine returned an empty schema-engine error in this environment, while Prisma Client and the SQL migration path work reliably.

## Business Rules

- Vehicle registration numbers are unique.
- Retired and in-shop vehicles cannot be dispatched.
- Vehicles already on trip cannot be double-booked.
- Expired-license, suspended, unavailable, and on-trip drivers cannot be assigned.
- Cargo weight cannot exceed vehicle maximum capacity.
- Dispatch atomically updates trip, vehicle, driver, notification, and activity records.
- Completion atomically validates odometer, updates trip, restores vehicle and driver, updates odometer, creates fuel log when supplied, and writes activity.
- Cancelling a dispatched trip atomically restores vehicle and driver availability.
- Active maintenance atomically creates the maintenance record, moves the vehicle to `IN_SHOP`, and writes activity.
- Maintenance completion restores the vehicle to `AVAILABLE` unless it has been retired.

## Calculation Formulas

- Fuel efficiency = distance travelled / fuel consumed.
- Fleet utilization = vehicles currently on trip / active non-retired vehicles x 100.
- Operational cost = fuel cost + maintenance cost.
- Vehicle ROI = (revenue - fuel cost - maintenance cost) / acquisition cost.

Zero and missing values are handled safely and shown as `N/A` where a calculation would be invalid.

## Testing

Critical workflow and calculation tests live in `src/lib/operations.test.ts`.

Covered checks include:

- Duplicate registration rejection.
- Retired and in-shop dispatch blocking.
- Expired, suspended, and on-trip driver blocking.
- Overweight cargo rejection.
- Atomic dispatch status updates.
- Double-booking prevention.
- Completion status restoration and fuel log creation.
- Cancellation restoration.
- Maintenance active and completion workflow.
- Fuel efficiency, operational cost, and ROI formulas.

Run:

```bash
npm test
```

## Screenshots

- Dashboard
  <img width="1919" height="962" alt="image" src="https://github.com/user-attachments/assets/c5773aed-6b3e-4b76-b19f-60d6d73b4a65" />
- Vehicle detail
- <img width="1919" height="966" alt="Screenshot 2026-07-12 123306" src="https://github.com/user-attachments/assets/7ed392a4-12b2-49d3-bd95-7495ddea0592" />
- Trip creation wizard
  <img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/5d09b63f-e423-4d7f-94db-2e2ccd5461bf" />
- Analytics
<img width="1912" height="963" alt="image" src="https://github.com/user-attachments/assets/f44febe0-ec95-4d71-ac44-162bf49f6c1d" />

- Reports
<img width="1919" height="968" alt="image" src="https://github.com/user-attachments/assets/615faad2-436e-4d91-8bfd-5f5e1bd71a66" />


## Known Limitations

- SQLite is used for local demonstration. PostgreSQL is recommended for production concurrency and native enum constraints.
- PDF export is not implemented; CSV export is available.
- Email reminders are not implemented; in-app notifications are available.
- Role permissions are centralized and enforced server-side, but fine-grained row ownership is out of scope for this hackathon build.

## Future Improvements

- PostgreSQL migration and hosted deployment.
- PDF report generation.
- File uploads for receipts, licenses, and vehicle documents.
- Time-based utilization metrics by vehicle availability window.
- Maintenance rules by odometer thresholds and recurring schedules.
- Email notification delivery.
