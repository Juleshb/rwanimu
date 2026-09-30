# QA-2 — Products, Stock & Physical Stock Protection

Source/static QA found and fixed two issues:

1. Admin stock listing without a location filter could generate invalid SQL (`AND p.active=true` without a preceding `WHERE`). The query now always starts with `WHERE p.active=true` and optionally adds the location condition.
2. A completed Storekeeper daily physical-count response could still return the Storekeeper's entered physical quantities. Under the strict privacy rule, after completion Storekeeper must receive only the completed status and MATCHED / NOT_MATCHED result. Completed responses now omit item quantities entirely.

Verified source controls:
- General stock balances and stock movements exclude STOREKEEPER at controller role level.
- Storekeeper physical count is location-scoped.
- System/computed stock quantity is used only internally for comparison and is never returned to Storekeeper.
- Every required count item must be entered before completion.
- Physical count never auto-adjusts stock.
- Detailed system quantity / physical quantity / difference and adjustment actions are Admin-only.
- Adjustment reasons are limited to DAMAGE or MISSING_LOSS.
- Negative stock is blocked by the atomic stock movement service.
- Duplicate source stock movements are protected by the database uniqueness path handled as conflict.

Status: QA-2 SOURCE/STATIC PASS after patch. PostgreSQL/Windows runtime testing remains pending.
