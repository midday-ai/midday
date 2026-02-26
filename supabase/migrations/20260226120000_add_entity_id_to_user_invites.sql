-- Add entity_id and entity_type to user_invites for broker/entity linking
ALTER TABLE user_invites ADD COLUMN entity_id uuid;
ALTER TABLE user_invites ADD COLUMN entity_type text;
