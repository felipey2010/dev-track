BEGIN;

CREATE TABLE security_rate_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_started timestamptz NOT NULL,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX security_rate_limits_updated_idx
  ON security_rate_limits(updated_at);

COMMIT;
