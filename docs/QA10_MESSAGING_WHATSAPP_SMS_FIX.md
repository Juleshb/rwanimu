# QA-10 — Messaging / WhatsApp / SMS
Status: SOURCE/STATIC PASS after fixes in Implementation 2.17.10.

## Checked
- Admin/Manager-only messaging; Storekeeper/Branch User excluded.
- Customer-linked WhatsApp/SMS history.
- WhatsApp text and image+caption; SMS text.
- Customer opt-in enforcement.
- Bulk Preview -> Recipient Count -> Confirm Send.
- All opted-in customers or selected-customer subset.
- Campaign/message failure history.

## Defects fixed
1. Invalid bulk channel could fall through to SMS logic and fail later at the database. Channel is now strictly validated.
2. Bulk messaging only supported all opted-in customers. Added selectedCustomerIds filtering to preview and campaign creation.
3. A customer who opted out after campaign creation could still receive a confirmed campaign. Consent/active/phone are now revalidated immediately before send; invalid recipients are SKIPPED.
4. Bulk provider failure could leave the created message QUEUED and not linked to the failed recipient. It is now marked FAILED and linked with failure reason.
5. Bulk send did not update conversation last_message_at. Fixed.
6. No API existed to maintain WhatsApp/SMS consent. Added Admin/Manager consent endpoint with audit event.

## Deployment/runtime pending
- Real WhatsApp Business Platform credentials and live send/receive webhook integration.
- Real SMS provider credentials.
- Browser/Windows UI and provider end-to-end tests.
- Provider delivery/read webhook verification and live inbound WhatsApp conversation testing.

No production-provider claim is made by this source QA.
