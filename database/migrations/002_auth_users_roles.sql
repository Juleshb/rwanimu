BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name varchar(160);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;

ALTER TABLE users DROP CONSTRAINT IF EXISTS branch_user_location_required;
ALTER TABLE users ADD CONSTRAINT branch_user_location_required CHECK (role <> 'BRANCH_USER' OR location_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id),
  action varchar(80) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid,
  location_id uuid REFERENCES locations(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON audit_events(actor_user_id, created_at DESC);
COMMIT;
