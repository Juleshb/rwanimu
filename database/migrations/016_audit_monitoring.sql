BEGIN;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS severity varchar(12) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','WARNING','CRITICAL'));
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS request_id varchar(100);
CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_action_idx ON audit_events(action,created_at DESC);

CREATE TABLE IF NOT EXISTS system_incidents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 incident_type varchar(60) NOT NULL,
 severity varchar(12) NOT NULL CHECK (severity IN ('WARNING','CRITICAL')),
 title varchar(180) NOT NULL,
 safe_message text NOT NULL,
 technical_details text,
 entity_type varchar(80), entity_id uuid,
 location_id uuid REFERENCES locations(id),
 status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 acknowledged_at timestamptz, acknowledged_by uuid REFERENCES users(id),
 resolved_at timestamptz, resolved_by uuid REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS system_incidents_open_idx ON system_incidents(severity,created_at DESC) WHERE status <> 'RESOLVED';
COMMIT;
