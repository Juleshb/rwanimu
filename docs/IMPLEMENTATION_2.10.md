# Implementation 2.10 — Sales Completion & Controlled Corrections

Status: IMPLEMENTED (source level; full PostgreSQL/Windows integration testing pending)

- Admin-only controlled void of confirmed sales with mandatory reason.
- Void restores sold stock through an auditable SALE_VOID_IN stock movement; it never deletes the original sale.
- Void is blocked when later customer debt-payment allocations or consumed sale-created credit make automatic reversal unsafe.
- Redo is a new confirmed sale linked with `replaces_sale_id`; only Admin may use the redo link, only after the original is VOIDED, and only once.
- Internal Sales Form endpoint intentionally excludes buying price, WAC and COGS.
- A4-half-friendly internal print/Save PDF React component; this is an internal form, not a customer receipt.
- Audit trail preserves SALE_CONFIRMED and SALE_VOIDED history.
