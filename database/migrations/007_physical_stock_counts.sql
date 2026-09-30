BEGIN;
CREATE TABLE IF NOT EXISTS physical_stock_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  count_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Africa/Kigali')::date),
  status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','COMPLETED')),
  completed_by uuid REFERENCES users(id),
  completed_at timestamptz,
  match_status varchar(20) CHECK (match_status IN ('MATCHED','NOT_MATCHED')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id,count_date)
);
CREATE TABLE IF NOT EXISTS physical_stock_count_items (
  count_id uuid NOT NULL REFERENCES physical_stock_counts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  physical_quantity numeric(18,3) CHECK (physical_quantity >= 0),
  counted_at timestamptz,
  PRIMARY KEY(count_id,product_id)
);
CREATE TABLE IF NOT EXISTS stock_adjustment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id uuid NOT NULL REFERENCES physical_stock_counts(id),
  product_id uuid NOT NULL REFERENCES products(id),
  system_quantity numeric(18,3) NOT NULL CHECK (system_quantity >= 0),
  physical_quantity numeric(18,3) NOT NULL CHECK (physical_quantity >= 0),
  difference numeric(18,3) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ADJUSTED','NO_ACTION')),
  resolution_reason varchar(30) CHECK(resolution_reason IN ('DAMAGE','MISSING_LOSS')),
  resolved_by uuid REFERENCES users(id), resolved_at timestamptz,
  UNIQUE(count_id,product_id)
);
COMMIT;
