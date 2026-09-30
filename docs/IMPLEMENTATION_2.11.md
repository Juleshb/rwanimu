# Implementation 2.11 — Branch Stock Request, Approval, Dispatch & Receipt

Implemented source-level workflow:
- Branch Stock Request is a system record only and is not a printable document.
- Admin approves/rejects and may approve partial quantities.
- Dispatch is online-only by role/API design and decreases Main Shop stock atomically; negative stock is rejected.
- Dispatch stores Main Shop WAC as the internal transfer cost snapshot.
- STOCK TRANSFER / DELIVERY NOTE is available only after dispatch. It exposes products/quantities and signature fields, but deliberately excludes transport cost and internal purchase/landed cost.
- Branch confirms received quantities. Branch stock increases only on receipt.
- Transport cost is recorded once on the transfer and allocated internally into Branch landed unit cost/WAC; Branch user does not re-enter or recalculate it.
- Partial/mismatched receipt becomes NEEDS_REVIEW for Admin. Received quantity cannot exceed dispatched quantity.
- Transfer stock movements use TRANSFER_OUT and TRANSFER_IN audit ledger entries.

Status: IMPLEMENTED at source level. Full PostgreSQL integration and Windows/browser testing remain pending.
