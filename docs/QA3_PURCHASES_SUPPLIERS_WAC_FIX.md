# QA-3 — Purchases, Suppliers & WAC

Source/static review: PASS after fixes.

## Verified
- Purchases are Admin-only.
- Purchases receive stock only into the active Main Shop.
- WAC formula uses existing quantity/cost plus incoming purchase quantity/cost.
- Purchase + stock + WAC + supplier account changes are atomic.
- Supplier credit is used before cash/debt.
- Supplier payments allocate oldest debt first.
- Overpayment becomes Supplier Credit/Advance.
- Buying cost/WAC/supplier financial endpoints remain Admin-only.

## Fixes made in 2.17.3
1. Supplier account row is now created and locked before reading/using credit, protecting concurrent purchase/payment operations from double-use/lost credit updates.
2. Confirmed purchases and supplier payments now write audit events for financial traceability.

## Still pending
Full PostgreSQL transaction/concurrency tests and Windows runtime tests.
