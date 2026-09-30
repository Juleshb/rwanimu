CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES users(id),
  delete_reason text,
  source_type text NOT NULL DEFAULT 'OPERATING' CHECK (source_type = 'OPERATING')
);
CREATE INDEX IF NOT EXISTS idx_expenses_location_date ON expenses(location_id,expense_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by,created_at DESC) WHERE deleted_at IS NULL;
-- Transfer transport cost is intentionally NOT copied into expenses.
-- It remains on stock_transfers.transport_cost to prevent double counting.
