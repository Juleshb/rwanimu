BEGIN;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_balances (
  location_id uuid NOT NULL REFERENCES locations(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity numeric(18,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(location_id, product_id)
);

CREATE TABLE IF NOT EXISTS offline_sales_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_transaction_id uuid NOT NULL UNIQUE,
  location_id uuid NOT NULL REFERENCES locations(id),
  user_id uuid NOT NULL REFERENCES users(id),
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_transaction_id uuid NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id),
  product_id uuid NOT NULL REFERENCES products(id),
  movement_type varchar(40) NOT NULL,
  quantity_delta numeric(18,3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_transaction_id, product_id, movement_type)
);

CREATE TABLE IF NOT EXISTS offline_business_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_transaction_id uuid NOT NULL UNIQUE,
  operation varchar(40) NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id),
  user_id uuid NOT NULL REFERENCES users(id),
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_transaction_id uuid NOT NULL UNIQUE,
  device_id uuid NOT NULL REFERENCES trusted_devices(id),
  user_id uuid NOT NULL REFERENCES users(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  operation varchar(40) NOT NULL,
  reason_code varchar(80) NOT NULL,
  reason text NOT NULL,
  payload jsonb NOT NULL,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sync_conflicts_open_idx ON sync_conflicts(created_at DESC) WHERE resolved_at IS NULL;
COMMIT;
