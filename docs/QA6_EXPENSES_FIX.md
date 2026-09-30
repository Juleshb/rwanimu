# QA-6 — Expenses

Status: SOURCE/STATIC PASS after fixes. Runtime PostgreSQL/Windows tests remain pending.

## Verified
- Expense creation: ADMIN, MANAGER, BRANCH_USER only.
- MANAGER is forced to Main Shop.
- BRANCH_USER is forced to their assigned branch.
- ADMIN can select a valid active location.
- Update/Delete are ADMIN-only at controller level.
- Amount must be > 0; description required and bounded.
- Delete requires a reason and is soft-delete.
- Transfer transport cost remains only on stock_transfers and is not copied to operating expenses, preventing double counting.

## Defects fixed in 2.17.6
1. Expense create/update/delete did not write dedicated audit events. Added atomic audit events for all three actions.
2. Offline EXPENSE sync was accepted into offline_business_events but did not create the central expense record. EXPENSE reconciliation now posts the expense atomically, validates allowed roles/fields, preserves the trusted-device location, and writes an audit event.

## Runtime note
Automated Jest/Vitest execution could not run in this environment because node dependencies are not installed (jest/vitest commands unavailable). This is not counted as runtime testing. PostgreSQL/Windows/browser runtime validation remains pending.
