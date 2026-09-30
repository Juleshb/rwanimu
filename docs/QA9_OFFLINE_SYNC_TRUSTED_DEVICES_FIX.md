# QA-9 Offline/Sync & Trusted Devices Fix

Status: SOURCE/STATIC PASS after fixes; Windows/PostgreSQL/browser runtime pending.

## Defects fixed
1. Sync client sent only `x-device-token` while API required `x-device-id`, causing valid sync to fail. Client now sends both.
2. Sync endpoint did not validate the Trusted Device secret token. It now requires device ID + token and compares the SHA-256 token hash stored for the active trusted device.
3. Offline sync lacked a server-side operation/role matrix. Storekeeper could otherwise craft a SALE sync manually. Server now restricts SALE/customer/debt to Admin/Manager/Branch User, Branch Stock Request to Branch User, Expenses to Admin/Manager/Branch User.
4. Device/user location scope check now explicitly covers both Branch User and Storekeeper.

## Existing protections confirmed
- IndexedDB persistent queue survives browser restart.
- PENDING/SYNCING items retry after reconnect; network failure returns item to PENDING.
- UUID client transaction ID plus PostgreSQL advisory lock and unique constraints provide idempotency.
- Central stock is row-locked and revalidated; insufficient stock becomes NEEDS_REVIEW rather than negative stock.
- Revoked device/offline authorizations are rejected.
- Server records SYNCED / NEEDS_REVIEW / REJECTED and audit events.

## Runtime still required
Real browser close/reopen, multi-device concurrency, actual network loss/reconnect, PostgreSQL transaction behavior, and Windows testing remain pending.
