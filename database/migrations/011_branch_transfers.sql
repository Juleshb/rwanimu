BEGIN;
CREATE TABLE IF NOT EXISTS stock_transfers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), transfer_no bigserial UNIQUE,
 from_location_id uuid NOT NULL REFERENCES locations(id), to_location_id uuid NOT NULL REFERENCES locations(id),
 status varchar(24) NOT NULL DEFAULT 'REQUESTED' CHECK(status IN('REQUESTED','APPROVED','REJECTED','IN_TRANSIT','COMPLETED','NEEDS_REVIEW')),
 transport_cost numeric(18,2) NOT NULL DEFAULT 0 CHECK(transport_cost>=0),
 requested_by uuid REFERENCES users(id), approved_by uuid REFERENCES users(id), dispatched_by uuid REFERENCES users(id), received_by uuid REFERENCES users(id),
 requested_at timestamptz NOT NULL DEFAULT now(), approved_at timestamptz, dispatched_at timestamptz, received_at timestamptz,
 admin_note text, discrepancy_note text
);
CREATE TABLE IF NOT EXISTS stock_transfer_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), transfer_id uuid NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES products(id), requested_qty numeric(18,3) NOT NULL CHECK(requested_qty>0),
 approved_qty numeric(18,3) CHECK(approved_qty>=0), dispatched_qty numeric(18,3) CHECK(dispatched_qty>=0), received_qty numeric(18,3) CHECK(received_qty>=0),
 dispatch_unit_cost numeric(18,4) CHECK(dispatch_unit_cost>=0), branch_landed_unit_cost numeric(18,4) CHECK(branch_landed_unit_cost>=0),
 UNIQUE(transfer_id,product_id)
);
CREATE INDEX IF NOT EXISTS stock_transfers_to_status_idx ON stock_transfers(to_location_id,status);
COMMIT;
