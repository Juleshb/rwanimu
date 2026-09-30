BEGIN;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS void_reason text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS voided_by uuid REFERENCES users(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS replaces_sale_id uuid REFERENCES sales(id);
CREATE INDEX IF NOT EXISTS sales_replaces_idx ON sales(replaces_sale_id) WHERE replaces_sale_id IS NOT NULL;
COMMIT;
