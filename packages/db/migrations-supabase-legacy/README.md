# Archived Supabase migrations

These SQL files were applied manually to Supabase. They are historical reference only, including their incomplete Drizzle metadata. Do not run them against a new database.

The maintained migration history is in `../migrations`, applied with `bun run db:migrate`. Its prerequisite migration replaces the former `setup-test-db.sql`, `drizzle.config.test.ts`, and `test-schema.ts` test-only bootstrap.
