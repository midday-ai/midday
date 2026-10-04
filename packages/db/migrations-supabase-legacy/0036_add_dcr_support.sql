-- Allow oauth_applications to be created without a team or user (for Dynamic Client Registration)
ALTER TABLE oauth_applications ALTER COLUMN team_id DROP NOT NULL;
ALTER TABLE oauth_applications ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE oauth_applications ALTER COLUMN client_secret DROP NOT NULL;
