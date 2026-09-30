# RWANIMU Company Ltd — Shop Management System

Implementation checkpoint: 2.1 Project Foundation & Core Setup.

## Approved stack
- Frontend: React + TypeScript
- Backend/API: Node.js + NestJS + TypeScript
- Database: PostgreSQL
- Offline layer: Trusted Device local persistence + sync engine (foundation folders only in 2.1)

## Repository structure
- `apps/admin-web` — management frontend
- `apps/api` — NestJS API
- `packages` — shared types, validation and UI packages
- `database` — migrations, seeds and backups
- `offline` — trusted-device offline/sync implementation area
- `tests` — cross-application tests
- `deployment` — production/staging deployment files
- `docs` — technical documentation

## Status
This package implements the 2.1 foundation. Business modules are intentionally not marked complete yet.


## Implementation 2.4
Persistent offline queue and server idempotency intake are implemented at source level. See `docs/IMPLEMENTATION_2.4.md`.

## Implementation 2.5
Server reconciliation now validates Trusted Device/user/location scope, applies idempotent atomic sync receipts, prevents central stock from going negative for offline sales, records conflicts for Admin review, and writes audit history. See `docs/IMPLEMENTATION_2.5.md`.

## Implementation 2.6
Products, per-location stock balances, stock movement ledger, low/out-of-stock classification, source-linked atomic movements, and negative-stock protection are implemented. Blind Physical Stock Count remains a dedicated later workflow to preserve its privacy rule.

## Implementation 2.7
Strict Storekeeper blind physical count is implemented. Storekeeper never receives system stock quantities; completed daily reports return only MATCHED / NOT_MATCHED. Detailed discrepancies and controlled DAMAGE / MISSING_LOSS adjustments are Admin-only. See `docs/IMPLEMENTATION_2.7.md`.

## Implementation 2.8
Purchases, Suppliers, Supplier Debt/Credit and Weighted Average Cost source foundation is implemented. See `docs/IMPLEMENTATION_2.8.md`.

## Implementation 2.10
Sales + Customer Debt/Credit source foundation is implemented. See `docs/IMPLEMENTATION_2.9.md`. Full PostgreSQL/Windows testing remains pending.


## Implementation 2.11
Branch Stock Request → Admin Approval/Reject → Dispatch/In Transit → Branch Receipt is implemented at source level. Delivery Note excludes transport/internal cost; transfer transport is allocated internally into Branch landed cost. See `docs/IMPLEMENTATION_2.11.md`.

## Implementation 2.12
Expenses source implementation added. Normal operating expenses are separated from transfer transport cost to prevent double counting. See `docs/IMPLEMENTATION_2.12.md`.


## Implementation 2.13
Role-scoped Reports/Dashboard foundation is implemented. Admin-only financial visibility is enforced server-side; Storekeeper reports never expose system stock quantity.

## Implementation 2.14
Customer Messaging, SMS & WhatsApp source foundation: Admin/Manager-only customer conversations, opt-in controls, WhatsApp text/image sending adapter, SMS adapter, bulk preview/recipient count, explicit Confirm Send, campaign/message history and failure tracking. Live provider credentials/incoming webhooks remain deployment integration/testing work.

## Implementation 2.15
Premium Public Website + Admin CMS foundation. See `docs/IMPLEMENTATION_2.15.md` and reusable `docs/RWANIMU_PUBLIC_WEBSITE_DESIGN_GUIDE.md`.

## Implementation 2.16
Backup/Restore source foundation. See docs/IMPLEMENTATION_2.16.md.

## Implementation 2.17
Audit Trail, friendly-error foundation and Admin System Monitoring are implemented at source level. See `docs/IMPLEMENTATION_2.17.md`. Full PostgreSQL/Windows QA remains pending.

## Implementation 2.18 — Official branding integration
Approved RWANIMU logo is integrated into Admin Web and Public Website. Contact roles: WhatsApp 0783005604; Telephone 0788542392. Location: Musanze / Muhoza. See `docs/IMPLEMENTATION_2.18_BRANDING.md`.
# rwanimu
