// Run once: npx tsx scripts/migrate-class-names.ts
import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  await sql`ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS class_names TEXT DEFAULT NULL`;
  console.log('✓ class_names column added');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
