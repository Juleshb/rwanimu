-- QA-1 fix: location is mandatory for scoped operational users.
ALTER TABLE users DROP CONSTRAINT IF EXISTS branch_user_location_required;
ALTER TABLE users ADD CONSTRAINT scoped_user_location_required
  CHECK (role NOT IN ('BRANCH_USER','STOREKEEPER') OR location_id IS NOT NULL);
