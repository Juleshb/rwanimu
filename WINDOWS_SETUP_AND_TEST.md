# RWANIMU Shop Management System — Windows Setup & Test

Status: RECONCILED SOURCE 0.2.19. Requirements remain authoritative. Windows/PostgreSQL end-to-end validation is still required before production.

## Prerequisites
1. Node.js LTS.
2. PostgreSQL 16+ with `psql` available.
3. VS Code (optional, recommended for testing).

## Database
Create database `rwanimu_shop`, copy `.env.example` to `.env`, and set the correct `DATABASE_URL` and a long random `JWT_SECRET`.
Run all SQL files in `database/migrations` in numeric order, then `database/seeds/001_locations.sql`.
For a local test Admin only, set `DEV_ADMIN_PASSWORD` in the terminal and run `npm run seed:dev-admin`; change that password after first login.

## Run
- `npm install`
- Terminal 1: `npm run dev:api`
- Terminal 2: `npm run dev:web`
- Open `http://localhost:5173`

## Required acceptance testing
Test each role separately: Admin, Manager, Storekeeper, Branch User. Verify no-negative-stock, blind physical count, purchase/WAC, sale/debt/credit, transfer request→approve→dispatch→receive, expenses, reports/privacy, offline queue/trusted-device reconciliation, messaging consent, CMS/public website, backup/restore, and monitoring/audit.

Do not mark PRODUCTION READY until the Windows + PostgreSQL checklist passes.
