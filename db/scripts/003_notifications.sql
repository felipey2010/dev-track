BEGIN;

CREATE TABLE notifications (
  id text PRIMARY KEY,
  recipient_user_id text NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id text
    REFERENCES users(id) ON DELETE SET NULL,
  actor_name_snapshot text,
  actor_system_role_snapshot system_role,
  event_key text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  entity_type audit_entity_type,
  entity_id text,
  action_url text,
  metadata_json jsonb,
  deduplication_key text,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notifications_event_key_not_blank
    CHECK (length(btrim(event_key)) > 0),
  CONSTRAINT notifications_title_not_blank
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT notifications_message_not_blank
    CHECK (length(btrim(message)) > 0),
  CONSTRAINT notifications_entity_reference_complete
    CHECK (
      (entity_type IS NULL AND entity_id IS NULL)
      OR (entity_type IS NOT NULL AND entity_id IS NOT NULL)
    ),
  CONSTRAINT notifications_action_url_is_internal
    CHECK (action_url IS NULL OR action_url = '/' OR action_url ~ '^/[^/]'),
  CONSTRAINT notifications_expiration_is_after_creation
    CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE UNIQUE INDEX notifications_deduplication_key_uidx
  ON notifications(deduplication_key)
  WHERE deduplication_key IS NOT NULL;

CREATE INDEX notifications_recipient_created_idx
  ON notifications(recipient_user_id, created_at DESC);

CREATE INDEX notifications_recipient_unread_idx
  ON notifications(recipient_user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX notifications_entity_idx
  ON notifications(entity_type, entity_id, created_at DESC)
  WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;

CREATE INDEX notifications_created_idx
  ON notifications(created_at);

COMMIT;
