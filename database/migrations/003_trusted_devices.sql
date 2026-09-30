BEGIN;
CREATE TABLE IF NOT EXISTS trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  device_name varchar(160) NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id),
  token_hash varchar(128) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  registered_by uuid NOT NULL REFERENCES users(id),
  registered_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES users(id),
  revoked_at timestamptz,
  last_seen_at timestamptz,
  last_sync_at timestamptz
);
CREATE TABLE IF NOT EXISTS trusted_device_users (
  device_id uuid NOT NULL REFERENCES trusted_devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  authorized_by uuid NOT NULL REFERENCES users(id),
  authorized_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY(device_id,user_id)
);
CREATE TABLE IF NOT EXISTS offline_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES trusted_devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id),
  authorization_hash varchar(128) NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS trusted_devices_location_idx ON trusted_devices(location_id,active);
CREATE INDEX IF NOT EXISTS offline_authorizations_lookup_idx ON offline_authorizations(device_id,user_id,expires_at);
COMMIT;
