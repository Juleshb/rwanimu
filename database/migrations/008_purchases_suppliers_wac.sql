BEGIN;
CREATE TABLE IF NOT EXISTS suppliers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160) NOT NULL, phone varchar(40), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_phone_unique ON suppliers(phone) WHERE phone IS NOT NULL;
CREATE TABLE IF NOT EXISTS purchases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), supplier_id uuid NOT NULL REFERENCES suppliers(id), location_id uuid NOT NULL REFERENCES locations(id),
 total numeric(18,2) NOT NULL DEFAULT 0 CHECK(total>=0), amount_paid numeric(18,2) NOT NULL DEFAULT 0 CHECK(amount_paid>=0),
 debt_remaining numeric(18,2) NOT NULL DEFAULT 0 CHECK(debt_remaining>=0), status varchar(20) NOT NULL CHECK(status IN('CONFIRMED','VOIDED')) DEFAULT 'CONFIRMED',
 created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS purchase_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE, product_id uuid NOT NULL REFERENCES products(id),
 quantity numeric(18,3) NOT NULL CHECK(quantity>0), unit_cost numeric(18,2) NOT NULL CHECK(unit_cost>=0), line_total numeric(18,2) NOT NULL CHECK(line_total>=0)
);
CREATE TABLE IF NOT EXISTS stock_costs (
 product_id uuid NOT NULL REFERENCES products(id), location_id uuid NOT NULL REFERENCES locations(id), weighted_average_cost numeric(18,4) NOT NULL DEFAULT 0 CHECK(weighted_average_cost>=0), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(product_id,location_id)
);
CREATE TABLE IF NOT EXISTS supplier_accounts (
 supplier_id uuid PRIMARY KEY REFERENCES suppliers(id), credit_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(credit_balance>=0), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supplier_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), supplier_id uuid NOT NULL REFERENCES suppliers(id), amount numeric(18,2) NOT NULL CHECK(amount>0), created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supplier_payment_allocations (
 payment_id uuid NOT NULL REFERENCES supplier_payments(id) ON DELETE CASCADE, purchase_id uuid NOT NULL REFERENCES purchases(id), amount numeric(18,2) NOT NULL CHECK(amount>0), PRIMARY KEY(payment_id,purchase_id)
);
COMMIT;
