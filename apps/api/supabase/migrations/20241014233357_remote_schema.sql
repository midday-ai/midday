-- Update the apps table with new columns
ALTER TABLE public.apps
ADD COLUMN IF NOT EXISTS equation JSONB,
ADD COLUMN IF NOT EXISTS version TEXT,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS app_name TEXT,
ADD COLUMN IF NOT EXISTS model_type TEXT,
ADD COLUMN IF NOT EXISTS input_schema JSONB,
ADD COLUMN IF NOT EXISTS output_schema JSONB,
ADD COLUMN IF NOT EXISTS dependencies JSONB,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS integration_type TEXT,
ADD COLUMN IF NOT EXISTS integration_config JSONB,
ADD COLUMN IF NOT EXISTS auth_method TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS api_version TEXT,
ADD COLUMN IF NOT EXISTS supported_features TEXT[],
ADD COLUMN IF NOT EXISTS data_sync_frequency TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_status TEXT,
ADD COLUMN IF NOT EXISTS user_permissions JSONB,
ADD COLUMN IF NOT EXISTS custom_fields JSONB,
ADD COLUMN IF NOT EXISTS installed_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add new indexes
CREATE INDEX IF NOT EXISTS apps_category_idx ON public.apps (category);
CREATE INDEX IF NOT EXISTS apps_model_type_idx ON public.apps (model_type);
CREATE INDEX IF NOT EXISTS apps_is_public_idx ON public.apps (is_public);
CREATE INDEX IF NOT EXISTS apps_tags_idx ON public.apps USING GIN (tags);
CREATE INDEX IF NOT EXISTS apps_integration_type_idx ON public.apps (integration_type);
CREATE INDEX IF NOT EXISTS apps_sync_status_idx ON public.apps (sync_status);

-- Add constraints for enum-like columns
ALTER TABLE public.apps
ADD CONSTRAINT apps_model_type_check
CHECK (model_type IN ('regression', 'time_series', 'monte_carlo', 'machine_learning', 'financial_model', 'factor_model'));

ALTER TABLE public.apps
ADD CONSTRAINT apps_integration_type_check
CHECK (integration_type IN ('accounting', 'banking', 'crm', 'payroll', 'erp', 'analytics', 'communication', 'project_management', 'custom', 'modelling', 'goal_templates'));

ALTER TABLE public.apps
ADD CONSTRAINT apps_auth_method_check
CHECK (auth_method IN ('oauth', 'api_key', 'username_password', 'none'));

ALTER TABLE public.apps
ADD CONSTRAINT apps_data_sync_frequency_check
CHECK (data_sync_frequency IN ('realtime', 'daily', 'weekly', 'monthly', 'manual'));

ALTER TABLE public.apps
ADD CONSTRAINT apps_sync_status_check
CHECK (sync_status IN ('active', 'paused', 'error'));

-- Update the "Apps can be viewed" policy to include public apps
DROP POLICY IF EXISTS "Apps can be viewed by members of the team" ON public.apps;
CREATE POLICY "Apps can be viewed by members of the team or if public"
ON public.apps FOR SELECT
TO authenticated
USING (team_id IN (SELECT private.get_teams_for_authenticated_user()) OR is_public = true);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_apps_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
DROP TRIGGER IF EXISTS update_apps_last_updated ON public.apps;
CREATE TRIGGER update_apps_last_updated
BEFORE UPDATE ON public.apps
FOR EACH ROW
EXECUTE FUNCTION update_apps_last_updated();

-- Function to validate integration config
CREATE OR REPLACE FUNCTION validate_integration_config()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.integration_type IS NOT NULL AND NEW.integration_config IS NULL THEN
        RAISE EXCEPTION 'Integration config cannot be null when integration type is set';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update sync status
CREATE OR REPLACE FUNCTION update_sync_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_sync_at IS DISTINCT FROM OLD.last_sync_at THEN
        NEW.sync_status = 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate integration config
DROP TRIGGER IF EXISTS validate_integration_config ON public.apps;
CREATE TRIGGER validate_integration_config
BEFORE INSERT OR UPDATE ON public.apps
FOR EACH ROW
EXECUTE FUNCTION validate_integration_config();

-- Trigger to update sync status
DROP TRIGGER IF EXISTS update_sync_status ON public.apps;
CREATE TRIGGER update_sync_status
BEFORE UPDATE ON public.apps
FOR EACH ROW
EXECUTE FUNCTION update_sync_status();
