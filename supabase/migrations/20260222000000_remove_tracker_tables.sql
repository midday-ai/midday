-- Remove time tracker tables (freelancing feature from Midday, not used in MCA)
-- Dependencies: tracker_project_tags and tracker_entries reference tracker_projects,
-- tracker_reports also references tracker_projects. CASCADE handles all FKs.

DROP TABLE IF EXISTS public.tracker_project_tags CASCADE;
DROP TABLE IF EXISTS public.tracker_entries CASCADE;
DROP TABLE IF EXISTS public.tracker_reports CASCADE;
DROP TABLE IF EXISTS public.tracker_projects CASCADE;
DROP TYPE IF EXISTS public."trackerStatus";
