CREATE TYPE platform_provider AS ENUM ('slack', 'telegram', 'whatsapp', 'sendblue');

CREATE TABLE platform_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  provider platform_provider NOT NULL,
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  external_user_id text NOT NULL,
  external_team_id text NOT NULL DEFAULT '',
  external_channel_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT platform_identities_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT platform_identities_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT platform_identities_provider_external_unique
    UNIQUE (provider, external_team_id, external_user_id)
);

CREATE INDEX platform_identities_provider_external_idx
  ON platform_identities (provider, external_team_id, external_user_id);
CREATE INDEX platform_identities_team_id_idx
  ON platform_identities (team_id);
CREATE INDEX platform_identities_user_id_idx
  ON platform_identities (user_id);

ALTER TABLE platform_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform identities can be created by a member of the team"
  ON platform_identities
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Platform identities can be selected by a member of the team"
  ON platform_identities
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Platform identities can be updated by a member of the team"
  ON platform_identities
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Platform identities can be deleted by a member of the team"
  ON platform_identities
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE TABLE platform_link_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  provider platform_provider NOT NULL,
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT platform_link_tokens_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT platform_link_tokens_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT platform_link_tokens_code_unique
    UNIQUE (code)
);

CREATE INDEX platform_link_tokens_code_idx
  ON platform_link_tokens (code);
CREATE INDEX platform_link_tokens_team_id_idx
  ON platform_link_tokens (team_id);
CREATE INDEX platform_link_tokens_user_id_idx
  ON platform_link_tokens (user_id);

ALTER TABLE platform_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform link tokens can be created by a member of the team"
  ON platform_link_tokens
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Platform link tokens can be selected by a member of the team"
  ON platform_link_tokens
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Platform link tokens can be updated by a member of the team"
  ON platform_link_tokens
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Platform link tokens can be deleted by a member of the team"
  ON platform_link_tokens
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));
