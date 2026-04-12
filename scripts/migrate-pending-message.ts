// Run once: npx tsx scripts/migrate-pending-message.ts
import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  await sql`ALTER TABLE groups ADD COLUMN IF NOT EXISTS pending_message TEXT DEFAULT NULL`;
  console.log('✓ pending_message column added to groups');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
