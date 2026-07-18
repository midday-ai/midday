-- Wrap auth.uid() in a scalar sub-select so Postgres evaluates it once per
-- statement (InitPlan) instead of once per scanned row. Same value, matching
-- the (SELECT ...) form every other policy in the schema already uses.
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

ALTER POLICY "Users can insert their own profile."
  ON users
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "Users can manage their own notification settings"
  ON notification_settings
  USING (user_id = (select auth.uid()));
