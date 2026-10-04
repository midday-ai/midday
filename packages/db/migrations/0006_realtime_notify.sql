CREATE OR REPLACE FUNCTION public.midday_realtime_notify() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  new_subset jsonb := '{}'::jsonb;
  old_subset jsonb := '{}'::jsonb;
  event_user_id uuid := NULL;
BEGIN
  IF NEW.team_id IS NULL THEN RETURN NULL; END IF;
  -- P03 recurring detection updates the just-inserted row from a nested trigger.
  -- Its parent INSERT already invalidates this team. Do not suppress ordinary
  -- recurring updates or nested changes to other fields (e.g. category deletion).
  IF TG_TABLE_NAME = 'transactions' AND TG_OP = 'UPDATE'
     AND pg_trigger_depth() > 1
     AND (to_jsonb(NEW) - ARRAY['recurring', 'frequency']) =
         (to_jsonb(OLD) - ARRAY['recurring', 'frequency']) THEN
    RETURN NULL;
  END IF;
  CASE TG_TABLE_NAME
    WHEN 'inbox' THEN
      new_subset := jsonb_build_object('id', NEW.id, 'status', NEW.status);
      IF TG_OP = 'UPDATE' THEN
        old_subset := jsonb_build_object('id', OLD.id, 'status', OLD.status);
      END IF;
    WHEN 'customers' THEN
      new_subset := jsonb_build_object('id', NEW.id, 'enrichment_status', left(NEW.enrichment_status, 256));
    WHEN 'documents' THEN
      new_subset := jsonb_build_object('id', NEW.id, 'processing_status', NEW.processing_status);
    WHEN 'activities' THEN
      event_user_id := NEW.user_id;
      new_subset := jsonb_build_object('id', NEW.id, 'user_id', NEW.user_id, 'priority', NEW.priority, 'type', NEW.type);
    WHEN 'transactions' THEN
      -- Identical team/type payloads coalesce within a transaction in Postgres.
      -- Adding an id or timestamp would produce 1000 events for 1000 inserts.
      NULL;
    ELSE RETURN NULL;
  END CASE;
  PERFORM pg_notify('midday_realtime', jsonb_build_object(
    'table', TG_TABLE_NAME, 'type', TG_OP, 'team_id', NEW.team_id,
    'user_id', event_user_id, 'new', new_subset, 'old', old_subset
  )::text);
  RETURN NULL;
END $$;
--> statement-breakpoint
CREATE TRIGGER midday_realtime_inbox AFTER INSERT OR UPDATE ON public.inbox FOR EACH ROW EXECUTE FUNCTION public.midday_realtime_notify();
--> statement-breakpoint
CREATE TRIGGER midday_realtime_customers AFTER INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.midday_realtime_notify();
--> statement-breakpoint
CREATE TRIGGER midday_realtime_documents AFTER INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.midday_realtime_notify();
--> statement-breakpoint
CREATE TRIGGER midday_realtime_transactions AFTER INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.midday_realtime_notify();
--> statement-breakpoint
CREATE TRIGGER midday_realtime_activities AFTER INSERT ON public.activities FOR EACH ROW EXECUTE FUNCTION public.midday_realtime_notify();
