BEGIN;

-- Dev Track uses JWT sessions and only persists the provider identity needed to
-- link a Google account to a local user. OAuth tokens are not refreshed or used
-- to call Google APIs, so retaining them would add unnecessary sensitive data.
ALTER TABLE accounts
  DROP COLUMN refresh_token,
  DROP COLUMN access_token,
  DROP COLUMN expires_at,
  DROP COLUMN token_type,
  DROP COLUMN scope,
  DROP COLUMN id_token,
  DROP COLUMN session_state;

COMMIT;
