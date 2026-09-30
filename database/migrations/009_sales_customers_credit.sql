BEGIN;
CREATE SEQUENCE IF NOT EXISTS sale_number_seq START 1;
CREATE TABLE IF NOT EXISTS customers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name varchar(160) NOT NULL,
 phone varchar(40),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique ON customers(phone) WHERE phone IS NOT NULL;
CREATE TABLE IF NOT EXISTS customer_accounts (
 customer_id uuid PRIMARY KEY REFERENCES customers(id),
 credit_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK(credit_balance>=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sale_number varchar(40) NOT NULL UNIQUE,
 location_id uuid NOT NULL REFERENCES locations(id),
 customer_id uuid REFERENCES customers(id),
 customer_name varchar(160), customer_phone varchar(40),
 total numeric(18,2) NOT NULL CHECK(total>=0),
 cash_paid numeric(18,2) NOT NULL DEFAULT 0 CHECK(cash_paid>=0),
 credit_used numeric(18,2) NOT NULL DEFAULT 0 CHECK(credit_used>=0),
 debt_remaining numeric(18,2) NOT NULL DEFAULT 0 CHECK(debt_remaining>=0),
 status varchar(20) NOT NULL DEFAULT 'CONFIRMED' CHECK(status IN('CONFIRMED','VOIDED')),
 created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sale_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES products(id), quantity numeric(18,3) NOT NULL CHECK(quantity>0),
 unit_price numeric(18,2) NOT NULL CHECK(unit_price>=0), line_total numeric(18,2) NOT NULL CHECK(line_total>=0),
 unit_cost numeric(18,4) NOT NULL CHECK(unit_cost>=0), cogs numeric(18,2) NOT NULL CHECK(cogs>=0)
);
CREATE TABLE IF NOT EXISTS customer_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES customers(id),
 amount numeric(18,2) NOT NULL CHECK(amount>0), created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customer_payment_allocations (
 payment_id uuid NOT NULL REFERENCES customer_payments(id) ON DELETE CASCADE,
 sale_id uuid NOT NULL REFERENCES sales(id), amount numeric(18,2) NOT NULL CHECK(amount>0), PRIMARY KEY(payment_id,sale_id)
);
CREATE INDEX IF NOT EXISTS sales_location_created_idx ON sales(location_id,created_at DESC);
CREATE INDEX IF NOT EXISTS sales_customer_created_idx ON sales(customer_id,created_at DESC);
COMMIT;
