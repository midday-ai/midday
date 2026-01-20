import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_SESSION_POOLER,
});

const db = drizzle(pool);

async function checkDatabase() {
  console.log("=== テーブル一覧 (public スキーマ) ===\n");
  
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  if (tables.rows.length === 0) {
    console.log("テーブルなし");
  } else {
    tables.rows.forEach((row: any) => console.log(`- ${row.table_name}`));
  }
  
  console.log("\n=== カスタム関数一覧 ===\n");
  
  const functions = await db.execute(sql`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    ORDER BY routine_name
  `);
  
  if (functions.rows.length === 0) {
    console.log("カスタム関数なし");
  } else {
    functions.rows.forEach((row: any) => console.log(`- ${row.routine_name}`));
  }
  
  console.log("\n=== 有効な拡張機能 ===\n");
  
  const extensions = await db.execute(sql`
    SELECT extname FROM pg_extension ORDER BY extname
  `);
  
  extensions.rows.forEach((row: any) => console.log(`- ${row.extname}`));
  
  await pool.end();
}

checkDatabase().catch(console.error);
