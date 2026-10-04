BEGIN;
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('MAIN_SHOP','BRANCH')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(80) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role varchar(30) NOT NULL CHECK (role IN ('ADMIN','MANAGER','STOREKEEPER','BRANCH_USER')),
  location_id uuid REFERENCES locations(id),
  active boolean NOT NULL DEFAULT true,
  preferred_language varchar(2) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','rw')),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
