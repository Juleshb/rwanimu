# Implementation 2.6 — Products, Stock & Stock Movement Foundation

Implemented source foundation:
- Products with unique case-insensitive names, selling price, active/inactive lifecycle.
- Stock balances separated by location (Main Shop / Branch).
- Immutable stock movement ledger with source transaction reference.
- Stock status rules: OUT_OF_STOCK = 0; LOW_STOCK = 1–50; IN_STOCK > 50.
- Atomic row-locked stock changes and negative-stock prevention.
- Duplicate source movement protection.
- Role/location-scoped stock reads; Admin may inspect locations.
- Foundation movement types for Purchase, Sale, Transfer and Admin Adjustment.

Blind Physical Stock Count is intentionally not implemented in this foundation endpoint. It will use a dedicated workflow so Storekeeper screens cannot reveal system quantity before count submission.

Status: IMPLEMENTED at source level; full PostgreSQL integration and Windows/PWA testing remain pending.
