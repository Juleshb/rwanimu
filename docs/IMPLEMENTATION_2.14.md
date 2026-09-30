# Implementation 2.14 — Customer Messaging, SMS & WhatsApp
Status: IMPLEMENTED at source-code level. Live provider credentials, incoming webhook handling, and production provider policy verification remain deployment/integration work.

Implemented: Admin/Manager-only messaging; customer-linked history; WhatsApp text/image outbound adapter; SMS adapter; WhatsApp/SMS opt-in flags; bulk preview/recipient count; DRAFT -> Confirm Send -> SENDING -> COMPLETED/PARTIAL/FAILED campaigns; per-recipient result history. Provider failure does not alter Sales/Stock transactions. Storekeeper and Branch User are excluded.
