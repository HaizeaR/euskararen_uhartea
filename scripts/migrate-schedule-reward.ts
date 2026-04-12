// Run once: npx tsx scripts/migrate-schedule-reward.ts
import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  await sql`ALTER TABLE groups     ADD COLUMN IF NOT EXISTS initial_reward_shown BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS weekly_schedule      TEXT    DEFAULT NULL`;
  console.log('✓ initial_reward_shown added to groups');
  console.log('✓ weekly_schedule added to classrooms');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
