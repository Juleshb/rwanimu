# QA-7 — Reports & Dashboard

Status: SOURCE/STATIC PASS after fixes.
Runtime PostgreSQL/Windows/browser testing remains pending.

## Findings fixed
1. Admin financial report previously joined `sales` to `sale_items` and summed `sales.total`, which repeated a sale total once per line item. Revenue is now aggregated directly from `sales`, while COGS is aggregated separately from `sale_items` joined to confirmed sales.
2. Admin dashboard supplier summary previously joined purchases and supplier accounts, which could repeat supplier credit once per purchase. Supplier debt and supplier credit are now aggregated independently.

## Permission/privacy checks
- Financial endpoint is Admin-only at controller and service levels.
- Manager and Branch User dashboard payloads contain operational sales/low-stock/out-of-stock counts only; no WAC, buying cost, COGS, gross profit, net profit or stock valuation.
- Non-Admin location scope is derived from authenticated user and rejects another requested location.
- Storekeeper dashboard returns only Physical Stock Count counts/status summary.
- Storekeeper physical-count report returns only count date, status and MATCHED/NOT_MATCHED; no system quantity, physical quantity, discrepancy quantity, WAC or financial values.
- Sales/expense reports exclude Storekeeper and preserve non-Admin location scope.
- No separate unrestricted export/report endpoint was found in the current source. Print/PDF clients must use permission-filtered report data.

## Pending runtime validation
- PostgreSQL query execution against seeded multi-item sales and multi-purchase suppliers.
- Windows/browser UI role-by-role visibility.
- Print/PDF rendered-output permission checks when runtime UI/export is exercised.
