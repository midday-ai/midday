-- Create the apps table
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id TEXT NOT NULL,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    settings JSONB,
    team_id UUID
);

-- Add indexes
CREATE INDEX IF NOT EXISTS apps_app_id_idx ON public.apps (app_id);
CREATE INDEX IF NOT EXISTS apps_team_id_idx ON public.apps (team_id);

-- Add foreign key constraints
ALTER TABLE public.apps
ADD CONSTRAINT apps_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.apps
ADD CONSTRAINT apps_team_id_fkey
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Apps can be created by a member of the team"
ON public.apps FOR INSERT
TO authenticated
WITH CHECK (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Apps can be viewed by members of the team"
ON public.apps FOR SELECT
TO authenticated
USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Apps can be updated by members of the team"
ON public.apps FOR UPDATE
TO authenticated
USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

CREATE POLICY "Apps can be deleted by members of the team"
ON public.apps FOR DELETE
TO authenticated
USING (team_id IN (SELECT private.get_teams_for_authenticated_user()));

-- Grant permissions
GRANT ALL ON public.apps TO authenticated;
GRANT ALL ON public.apps TO service_role;