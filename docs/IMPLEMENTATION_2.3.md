# Implementation 2.3 — Trusted Devices & Offline Authentication

Implemented foundation:
- Admin-only Trusted Device registration and revocation.
- Unique device UUID plus high-entropy device token; only SHA-256 token hash is stored centrally.
- Device is bound to one location and explicit authorized users.
- Branch User authorization is rejected when user location and device location differ.
- Offline authorization can only be issued after an authenticated online session on an active Trusted Device.
- Offline authorization expires after 72 hours and can be revoked centrally.
- Device revocation invalidates active offline authorizations when the device reconnects/checks central state.
- Last-seen/last-sync database metadata is available for the future sync engine.
- Register/revoke actions feed the audit trail.

## Status boundary
This implements the server/database foundation. It does not claim Windows/PWA production testing, secure OS keystore integration, or the full local offline database/sync queue. Those belong to later implementation/testing stages.
