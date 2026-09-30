BEGIN;
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  selling_price numeric(18,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS products_name_ci_unique ON products (lower(name));

CREATE TABLE IF NOT EXISTS stock_balances (
  product_id uuid NOT NULL REFERENCES products(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  quantity numeric(18,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(product_id, location_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  location_id uuid NOT NULL REFERENCES locations(id),
  movement_type varchar(40) NOT NULL CHECK (movement_type IN ('PURCHASE_IN','SALE_OUT','TRANSFER_OUT','TRANSFER_IN','ADJUSTMENT_IN','ADJUSTMENT_OUT')),
  quantity numeric(18,3) NOT NULL CHECK (quantity > 0),
  quantity_before numeric(18,3) NOT NULL CHECK (quantity_before >= 0),
  quantity_after numeric(18,3) NOT NULL CHECK (quantity_after >= 0),
  source_type varchar(50) NOT NULL,
  source_id uuid NOT NULL,
  reason text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS stock_movement_source_once
  ON stock_movements(product_id, location_id, movement_type, source_type, source_id);
CREATE INDEX IF NOT EXISTS stock_movements_location_created_idx ON stock_movements(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_product_created_idx ON stock_movements(product_id, created_at DESC);
COMMIT;
