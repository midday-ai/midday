# Local migration history

The SQL files and `meta/_journal.json` retain the complete ordered migration history.
`meta/0006_snapshot.json` is the consolidated schema-generation checkpoint after
migration 0006; earlier intermediate snapshots were removed to reduce review size.
It was generated from `src/schema.ts`, and `drizzle-kit generate` reports no diff.

This metadata consolidation does not squash, renumber, or change executable SQL.
Existing databases keep their migration journal; fresh databases apply every SQL
migration in order. Continue generating new migrations from this checkpoint.
