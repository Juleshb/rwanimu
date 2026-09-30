# QA-4 — Sales, Customers, Debt & Customer Credit

Status: SOURCE/STATIC PASS after fixes. Runtime PostgreSQL/Windows testing remains pending.

## Checks
- Sales restricted to ADMIN, MANAGER, BRANCH_USER; STOREKEEPER excluded.
- Non-Admin sale location comes from authenticated user scope.
- Stock row is locked and insufficient stock is rejected; negative stock is prevented.
- Customer Credit is used before cash.
- Credit sale requires a registered customer.
- Overpayment is preserved as Customer Credit; no cash-refund path exists.
- Customer debt payments allocate oldest confirmed debt first.
- Sale void is Admin-only, requires reason, restores stock, and is audited.
- Redo is Admin-only and requires original sale to be VOIDED.
- Internal Sales Form exposes selling data but not buying cost/COGS.

## QA fixes
1. Reject duplicate product lines in one sale. Previously two lines for the same product could read the same pre-sale stock before posting movements, creating an incorrect final balance. The user must combine quantity into one line.
2. Ensure and lock the customer account row before reading/updating Customer Credit. This prevents concurrent sale/payment operations from racing on a missing account row or silently overwriting credit. Customer debt payment also locks the customer/account before allocation.

## Remaining runtime tests
- Real PostgreSQL concurrent sale tests.
- Simultaneous sale vs customer debt-payment/credit tests.
- Windows/browser UI Save + Confirm interaction.
- Print layout on the target Windows machine.
