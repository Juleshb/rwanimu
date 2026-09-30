# Implementation 2.5 — Offline/Online Sync Engine & Server Reconciliation

Status: IMPLEMENTED (source level; full PostgreSQL/Windows integration testing remains for the testing phase).

Implemented:
- Server-side envelope, user, Trusted Device and location validation.
- PostgreSQL advisory transaction lock plus unique client UUID for idempotent retry protection.
- Atomic reconciliation transaction: business effect + sync receipt + audit are committed together or rolled back together.
- Offline SALE reconciliation locks central inventory rows, prevents negative stock, writes staging sale and inventory movements once.
- Insufficient/missing stock is retained as NEEDS_REVIEW rather than silently changing stock.
- CUSTOMER_UPSERT, DEBT_PAYMENT, BRANCH_STOCK_REQUEST and EXPENSE are validated and persisted as offline business events for their dedicated domain modules to consume/upgrade in later implementation stages.
- sync_conflicts stores open reconciliation conflicts with reason codes and original payload.
- Successful sync updates Trusted Device last_sync_at and creates an audit event.

Important boundary:
The sale table in this stage is deliberately `offline_sales_staging`; final Sales/Payments/Customer Debt/COGS/WAC posting belongs to the dedicated Sales and financial implementation stages. This avoids pretending those modules are complete before they are built.
