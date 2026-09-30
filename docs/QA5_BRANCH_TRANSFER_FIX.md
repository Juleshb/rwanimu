# QA-5 Branch Stock Transfer — Source/Static QA

Status: PASS after fixes (runtime PostgreSQL/Windows tests pending).

Validated workflow: Branch Request -> Admin Approval/Reject -> Dispatch -> In Transit -> Branch Receipt -> Completed or Needs Review.

Fixes applied:
1. Receipt confirmation is Branch User only; service also enforces this defense-in-depth.
2. Delivery Note cannot be generated before dispatch; Branch Request remains a system record only and is not printable.
3. Duplicate product lines in one request are rejected before database insert.
4. Transfer request/approval/rejection/dispatch/receipt now create audit events with actor and location.

Existing protections revalidated:
- Main stock decreases only at Dispatch.
- Branch stock increases only at Receipt.
- Dispatch cannot exceed approved quantity and cannot make Main stock negative.
- Receipt cannot exceed dispatched quantity.
- Quantity mismatch produces NEEDS_REVIEW for Admin review.
- Transport cost is stored internally and excluded from Delivery Note.
- Branch landed unit cost is updated internally.
- Delivery Note contains transfer number, Main-to-Branch names, dispatched items/quantities and signature fields; internal costs are excluded.

Pending runtime validation: real PostgreSQL transaction/concurrency tests, PDF/print rendering, and Windows/browser end-to-end testing.
