# QA-8 — Physical Stock Count & Storekeeper Privacy

Source/static review against Implementation 2.17.7.

## Fixes applied
1. Daily Storekeeper count now creates checklist items only for active products that belong to the Storekeeper's assigned location through `stock_balances`; it no longer pulls every active product globally.
2. Admin discrepancy adjustment is now atomic: discrepancy review row, stock balance, stock movement, review resolution, and audit event are committed together. This prevents stock being changed while a discrepancy remains pending if a later write fails.

## Verified protections
- Storekeeper is excluded from general stock-balance and stock-movement endpoints.
- Storekeeper daily-count scope comes only from the authenticated user's assigned location.
- Before completion, Storekeeper receives product identity and the physical quantity they entered, never system/computed quantity.
- Completion is blocked until every required checklist item has a physical quantity.
- System quantity is used only internally during comparison.
- Completed Storekeeper response/history exposes only status and MATCHED / NOT_MATCHED; no physical quantity, system quantity, discrepancy, WAC, or financial values.
- Physical count does not auto-adjust stock.
- Detailed physical/system/discrepancy values and adjustments are Admin-only.
- Adjustment reasons remain restricted to DAMAGE or MISSING_LOSS.

## Status
QA-8 SOURCE/STATIC: PASS after fixes.
Windows/PostgreSQL/browser runtime: PENDING.
