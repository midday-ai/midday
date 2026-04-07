CREATE TABLE provider_notification_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  batch_key text NOT NULL,
  platform_identity_id uuid NOT NULL,
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  provider platform_provider NOT NULL,
  event_family text NOT NULL,
  payload jsonb NOT NULL,
  notification_context jsonb,
  window_ends_at timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT provider_notification_batches_identity_id_fkey
    FOREIGN KEY (platform_identity_id) REFERENCES platform_identities(id) ON DELETE CASCADE,
  CONSTRAINT provider_notification_batches_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT provider_notification_batches_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT provider_notification_batches_batch_key_unique
    UNIQUE (batch_key)
);

CREATE INDEX provider_notification_batches_due_idx
  ON provider_notification_batches (sent_at, window_ends_at);
CREATE INDEX provider_notification_batches_identity_idx
  ON provider_notification_batches (platform_identity_id);
CREATE INDEX provider_notification_batches_team_id_idx
  ON provider_notification_batches (team_id);

ALTER TABLE provider_notification_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider notification batches can be created by a member of the team"
  ON provider_notification_batches
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Provider notification batches can be selected by a member of the team"
  ON provider_notification_batches
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Provider notification batches can be updated by a member of the team"
  ON provider_notification_batches
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Provider notification batches can be deleted by a member of the team"
  ON provider_notification_batches
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
