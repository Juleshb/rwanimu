CREATE TABLE IF NOT EXISTS backup_runs (
 id uuid PRIMARY KEY,
 backup_type text NOT NULL CHECK (backup_type IN ('DAILY','MANUAL','PRE_RESTORE')),
 status text NOT NULL CHECK (status IN ('STARTED','SUCCEEDED','FAILED')),
 storage_key text,
 second_copy_key text,
 checksum_sha256 text,
 size_bytes bigint,
 requested_by uuid REFERENCES users(id),
 started_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 error_message text
);
CREATE INDEX IF NOT EXISTS idx_backup_runs_started_at ON backup_runs(started_at DESC);
CREATE TABLE IF NOT EXISTS restore_runs (
 id uuid PRIMARY KEY,
 source_backup_id uuid NOT NULL REFERENCES backup_runs(id),
 safety_backup_id uuid REFERENCES backup_runs(id),
 status text NOT NULL CHECK (status IN ('STARTED','SUCCEEDED','FAILED')),
 requested_by uuid NOT NULL REFERENCES users(id),
 confirmation_text text NOT NULL,
 started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, error_message text
);
