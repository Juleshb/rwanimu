# QA-1 Auth / Roles Fix

Storekeeper location scope is now mandatory at user creation and database level. Trusted-device registration, offline authorization, and offline verification also require a Storekeeper's assigned location to match the device location.

Status: source/static fix implemented. Runtime PostgreSQL/Windows verification remains pending.
