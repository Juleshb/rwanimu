# Implementation 2.12 — Expenses

Status: IMPLEMENTED (source level; full PostgreSQL/Windows integration testing pending)

- Normal operating Expense form is intentionally simple: Description/Reason + Amount.
- Date, creator and location are captured by the server; users do not type them during normal entry.
- Manager creates/views Main Shop expenses only.
- Branch User creates/views own Branch expenses only.
- Admin can create/view across permitted locations and is the only role allowed to correct/delete an expense.
- Delete is soft-delete with mandatory reason so historical accountability is preserved.
- Transfer transport cost is NOT inserted into normal expenses. It remains recorded once on the transfer, preventing double counting while still being available for landed-cost/financial reporting.
- Storekeeper has no Expenses access.
- Filters support date range, location (Admin) and creator.
