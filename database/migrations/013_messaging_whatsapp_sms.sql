ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sms_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sms_opt_in_at timestamptz;

CREATE TABLE IF NOT EXISTS message_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  channel text NOT NULL CHECK(channel IN ('WHATSAPP','SMS')),
  status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED')),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, channel)
);
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES message_conversations(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  channel text NOT NULL CHECK(channel IN ('WHATSAPP','SMS')),
  direction text NOT NULL CHECK(direction IN ('OUTBOUND','INBOUND')),
  body text,
  media_url text,
  provider_message_id text,
  status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','SENT','DELIVERED','READ','FAILED','RECEIVED')),
  failure_reason text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_messages_provider_id ON messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_messages_customer_created ON messages(customer_id,created_at DESC);

CREATE TABLE IF NOT EXISTS message_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK(channel IN ('WHATSAPP','SMS')),
  title text NOT NULL,
  body text,
  media_url text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','CONFIRMED','SENDING','COMPLETED','PARTIAL','FAILED')),
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES users(id),
  confirmed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS message_campaign_recipients (
  campaign_id uuid NOT NULL REFERENCES message_campaigns(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  message_id uuid REFERENCES messages(id),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SENT','FAILED','SKIPPED')),
  failure_reason text,
  PRIMARY KEY(campaign_id,customer_id)
);
