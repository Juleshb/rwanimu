# Implementation 2.2 — Authentication, Users, Roles & Permissions

Implemented source foundation:
- Username/password login through NestJS API.
- Password hashing with Node scrypt + random salt; plaintext passwords are never stored.
- JWT session token with server-side active/session-version revalidation.
- Failed-login counter and temporary lock after repeated failures.
- Admin-only user creation/listing, activation/deactivation and password reset.
- User self-service password change requiring current password.
- Roles: ADMIN, MANAGER, STOREKEEPER, BRANCH_USER.
- Branch User requires a location; reusable backend location-scope enforcement helper prevents cross-location access.
- User/security changes write audit events.
- Deactivation/password reset increments session_version to invalidate existing sessions.

## Important status
This is an implementation source milestone. Full integration testing requires installing dependencies, applying migrations to PostgreSQL, setting a strong JWT_SECRET and running the API test suite in the target development/Windows environment. Production-ready status is NOT claimed.
