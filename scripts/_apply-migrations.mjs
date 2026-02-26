#!/usr/bin/env node
/**
 * Apply broker & syndication migrations to cloud Supabase.
 * Temporary script — delete after use.
 */
import pg from 'pg';
import { readFileSync } from 'fs';
const { Client } = pg;

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('Missing DATABASE_URL env var');
  process.exit(1);
}

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  console.log('Connected to cloud Supabase\n');

  // Check if brokers table already exists
  const check = await client.query(`SELECT to_regclass('public.brokers') as exists`);
  if (check.rows[0].exists) {
    console.log('brokers table already exists, skipping broker migration.');
  } else {
    console.log('Applying brokers migration...');
    const brokersSql = readFileSync('supabase/migrations/20260216000000_add_brokers.sql', 'utf8');
    await client.query(brokersSql);
    console.log('  Done.');
  }

  // Check if syndicators table already exists
  const check2 = await client.query(`SELECT to_regclass('public.syndicators') as exists`);
  if (check2.rows[0].exists) {
    console.log('syndicators table already exists, skipping syndication migration.');
  } else {
    console.log('Applying syndication migration...');
    const syndicationSql = readFileSync('supabase/migrations/20260217000000_add_syndication.sql', 'utf8');
    await client.query(syndicationSql);
    console.log('  Done.');
  }

  // Reload PostgREST schema cache so REST API picks up new tables
  console.log('\nNotifying PostgREST to reload schema...');
  await client.query(`NOTIFY pgrst, 'reload schema'`);
  console.log('  Done.');

  await client.end();
  console.log('\nMigrations applied successfully.');
}

run().catch(async err => {
  console.error('Error:', err.message);
  await client.end();
  process.exit(1);
});
