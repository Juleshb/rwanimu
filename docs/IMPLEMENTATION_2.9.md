# Implementation 2.9 — Sales, Customer Debt & Customer Credit

Status: IMPLEMENTED (source level; full PostgreSQL/Windows integration testing pending).

Implemented:
- Atomic confirmed sale: sale + items + stock OUT + COGS snapshot + customer debt/credit + audit.
- Negative stock prevention using row locks before stock deduction.
- Registered-customer debt; walk-in/cash sale supported.
- Customer Credit is used first on the next purchase; overpayment becomes Customer Credit (no cash refund).
- Customer debt payments allocate oldest outstanding confirmed sale first; excess becomes Customer Credit.
- Admin/Manager/Branch User sales access; Storekeeper excluded.
- Sale number generated automatically.
- Buying cost/WAC/COGS are stored internally and excluded from ordinary sale-list response.
- Fixed PurchasesModule DatabaseModule dependency import discovered during 2.9 source integration review.

Still pending later implementation/testing:
- Controlled Admin Void & Redo workflow.
- Final internal A4-half print form UI.
- Full offline sale posting from staging into final sales ledger.
- Full PostgreSQL integration and Windows UI testing.
