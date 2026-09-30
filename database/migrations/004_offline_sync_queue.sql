BEGIN;
CREATE TABLE IF NOT EXISTS sync_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_transaction_id uuid NOT NULL UNIQUE,
  operation varchar(40) NOT NULL,
  device_id uuid NOT NULL REFERENCES trusted_devices(id),
  user_id uuid NOT NULL REFERENCES users(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('SYNCED','NEEDS_REVIEW','REJECTED')),
  server_reference varchar(160),
  reason text
);
CREATE INDEX IF NOT EXISTS sync_transactions_device_idx ON sync_transactions(device_id,received_at DESC);
CREATE INDEX IF NOT EXISTS sync_transactions_status_idx ON sync_transactions(status,received_at DESC);
COMMIT;
