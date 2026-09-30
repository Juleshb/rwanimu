# Implementation 2.8 — Purchases, Suppliers & WAC

Implemented source foundation:
- Admin-only suppliers, purchases, supplier account/payment endpoints.
- Confirmed purchase receives stock into the active Main Shop only.
- Weighted Average Cost recalculated atomically per product/location.
- Supplier debt is tracked; supplier payments allocate oldest outstanding purchase first.
- Existing supplier credit is consumed first; overpayment becomes Supplier Credit/Advance.
- Purchase, stock movement, WAC, debt and credit changes run in one PostgreSQL transaction.
- Buying cost/WAC and supplier financial endpoints are not exposed to Storekeeper/Branch roles.

Testing status: source/static checks only. Full PostgreSQL/API/Windows integration testing remains pending.
